// src/app/actions/allocation.ts
"use server";

import { prisma } from "../lib/prisma";
import { runSmartAllocation } from "../lib/allocation-engine";
import { revalidatePath } from "next/cache";

export async function executeAllocationAction() {
  try {
    // 1. Sadece bekleyen (PENDING) veya kısmi karşılanmış (PARTIAL) talepleri al
    const demandsDb = await prisma.storeDemand.findMany({
      where: {
        status: {
          in: ["PENDING", "PARTIAL"],
        },
      },
      include: {
        store: true,
        product: true,
      },
    });

    // Eğer hiç açık talep yoksa erken çık
    if (demandsDb.length === 0) {
      return {
        success: true,
        message: "Dağıtılmayı bekleyen açık talep bulunamadı.",
      };
    }

    // 2. Stok, rota ve depo bilgilerini çek
    const stocksDb = await prisma.warehouseStock.findMany({
      include: {
        warehouse: true,
        product: true,
      },
    });

    const routesDb = await prisma.warehouseRoute.findMany();

    const warehousesDb = await prisma.warehouse.findMany();

    // 3. Verileri algoritmanın beklediği formata dönüştür
    const demands = demandsDb.map((d) => ({
      demandId: d.id,
      storeId: d.storeId,
      storeName: d.store.name,
      storePriority: d.store.priority,
      productId: d.productId,
      productName: d.product.name,
      requestedQty: d.requestedQuantity,
    }));

    const stocks = stocksDb.map((s) => ({
      warehouseId: s.warehouseId,
      warehouseName: s.warehouse.name,
      productId: s.productId,
      availableQty: s.quantity,
    }));

    const routes = routesDb.map((r) => ({
      warehouseId: r.warehouseId,
      storeId: r.storeId,
      shippingCost: r.shippingCost,
      deliveryDays: r.deliveryDays,
    }));

    // 4. Algoritmayı çalıştır (depo kapasitelerini de gönder)
    const result = runSmartAllocation(demands, stocks, routes, warehousesDb);

    // 5. Transaction ile atomik kaydet
    await prisma.$transaction(async (tx) => {
      // 5a. Yeni AllocationRun kaydı oluştur
      const run = await tx.allocationRun.create({
        data: {
          totalCost: result.totalCost,
          fulfillmentRate: result.fulfillmentRate,
          totalRequested: result.totalRequested,
          totalFulfilled: result.totalFulfilled,
        },
      });

      // 5b. Her bir allocation item'ını kaydet ve stoktan düş
      for (const item of result.allocations) {
        await tx.allocationItem.create({
          data: {
            runId: run.id,
            demandId: item.demandId,
            warehouseId: item.warehouseId,
            productId: item.productId,
            allocatedQty: item.allocatedQty,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            deliveryDays: item.deliveryDays,
          },
        });

        // Depo stok miktarını güncelle
        await tx.warehouseStock.update({
          where: {
            warehouseId_productId: {
              warehouseId: item.warehouseId,
              productId: item.productId,
            },
          },
          data: {
            quantity: {
              decrement: item.allocatedQty,
            },
          },
        });
      }

      // 5c. Talep durumlarını güncelle
      for (const demand of demandsDb) {
        const allocatedForThis = result.allocations
          .filter((a) => a.demandId === demand.id)
          .reduce((sum, curr) => sum + curr.allocatedQty, 0);

        let newStatus: string;

        if (allocatedForThis >= demand.requestedQuantity) {
          newStatus = "FULFILLED";
        } else if (allocatedForThis > 0) {
          newStatus = "PARTIAL";
        } else {
          newStatus = "PENDING"; // Hiç allocation alamamışsa beklemeye devam
        }

        await tx.storeDemand.update({
          where: { id: demand.id },
          data: { status: newStatus },
        });
      }
    });

    // 6. Sayfayı yenile (taze veri gösterimi için)
    revalidatePath("/");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Allocation hatası:", error);
    return {
      success: false,
      message: "Dağıtım sırasında bir hata oluştu. Lütfen tekrar deneyin.",
    };
  }
}
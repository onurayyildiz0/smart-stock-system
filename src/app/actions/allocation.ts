// src/app/actions/allocation.ts
"use server";

import { prisma } from "../lib/prisma";
import { runSmartAllocation } from "../lib/allocation-engine";
import { revalidatePath } from "next/cache";

export async function executeAllocationAction() {
  try {
    // 1. Talepleri çekerken daha önce gönderilenleri (allocations) de çekiyoruz!
    const demandsDb = await prisma.storeDemand.findMany({
      where: {
        status: {
          in: ["PENDING", "PARTIAL"],
        },
      },
      include: {
        store: true,
        product: true,
        allocations: true, // <-- BÜYÜK DÜZELTME: Eski sevkiyat geçmişini getir
      },
    });

    if (demandsDb.length === 0) {
      return {
        success: true,
        message: "Dağıtılmayı bekleyen açık talep bulunamadı.",
      };
    }

    const stocksDb = await prisma.warehouseStock.findMany({
      include: { warehouse: true, product: true },
    });
    const routesDb = await prisma.warehouseRoute.findMany();
    const warehousesDb = await prisma.warehouse.findMany();

    // 3. Verileri formata dönüştürürken "Kalan İhtiyacı" hesapla
    const demands = demandsDb
      .map((d) => {
        // Bu talep için daha önce kaç adet ürün yollanmış?
        const alreadyAllocated = d.allocations.reduce(
          (sum, a) => sum + a.allocatedQty,
          0,
        );

        // Gerçekten yollanması gereken kalan miktar (Örn: 70 - 15 = 55)
        const trueRemainingQty = d.requestedQuantity - alreadyAllocated;

        return {
          demandId: d.id,
          storeId: d.storeId,
          storeName: d.store.name,
          storePriority: d.store.priority,
          productId: d.productId,
          productName: d.product.name,
          requestedQty: trueRemainingQty, // Artık 70'i değil, kalanı gönderiyoruz!
        };
      })
      .filter((d) => d.requestedQty > 0); // Sadece ihtiyacı kalanları listeye al

    // Kalan ihtiyacı olan ürün yoksa erken çık
    if (demands.length === 0) {
      return { success: true, message: "Tüm talepler zaten karşılanmış." };
    }

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

    // 4. Algoritmayı kalan gerçek ihtiyaçlar (trueRemainingQty) ile çalıştır
    const result = runSmartAllocation(demands, stocks, routes, warehousesDb);

    // 5. Transaction
    await prisma.$transaction(async (tx) => {
      const run = await tx.allocationRun.create({
        data: {
          totalCost: result.totalCost,
          fulfillmentRate: result.fulfillmentRate,
          totalRequested: result.totalRequested,
          totalFulfilled: result.totalFulfilled,
        },
      });

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

        await tx.warehouseStock.update({
          where: {
            warehouseId_productId: {
              warehouseId: item.warehouseId,
              productId: item.productId,
            },
          },
          data: {
            quantity: { decrement: item.allocatedQty },
          },
        });
      }

      // 5c. Talep durumlarını güncellerken geçmişi de hesaba kat
      for (const demand of demandsDb) {
        // Bu seferki çalıştırmada gönderilen miktar
        const newlyAllocated = result.allocations
          .filter((a) => a.demandId === demand.id)
          .reduce((sum, curr) => sum + curr.allocatedQty, 0);

        // Geçmişteki çalıştırmalarda gönderilen miktar
        const oldAllocated = demand.allocations.reduce(
          (sum, curr) => sum + curr.allocatedQty,
          0,
        );

        // Toplam elimize ulaşan
        const totalAllocatedNow = oldAllocated + newlyAllocated;

        let newStatus: string = demand.status;
        if (totalAllocatedNow >= demand.requestedQuantity) {
          newStatus = "FULFILLED"; // Tamamen Karşılandı
        } else if (totalAllocatedNow > 0) {
          newStatus = "PARTIAL"; // Kısmi Karşılandı
        }

        if (newStatus !== demand.status) {
          await tx.storeDemand.update({
            where: { id: demand.id },
            data: { status: newStatus },
          });
        }
      }
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Allocation hatası:", error);
    return { success: false, message: "Dağıtım sırasında hata oluştu." };
  }
}

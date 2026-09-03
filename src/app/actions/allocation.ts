// src/app/actions/allocation.ts
"use server";

import { prisma } from "../lib/prisma";
import { runSmartAllocation } from "../lib/allocation-engine";
import { revalidatePath } from "next/cache";
import { authOptions } from "../lib/auth";
import { getServerSession } from "next-auth";

export async function runAllocationAction() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return { error: "Yalnızca admin optimizasyon çalıştırabilir." };
    }

    // 1. Bekleyen talepleri geçmiş karşılamalarıyla çek
    const demandsDb = await prisma.storeDemand.findMany({
      where: {
        status: { in: ["PENDING", "PARTIAL"] },
      },
      include: {
        store: true,
        product: true,
        allocations: true,
      },
    });

    if (demandsDb.length === 0) {
      return { success: true, message: "Açık talep bulunmuyor." };
    }

    // 2. Kalan ihtiyaçları hesapla
    const demands = demandsDb
      .map((d) => {
        const alreadyAllocated = d.allocations.reduce(
          (sum, a) => sum + a.allocatedQty,
          0,
        );
        const trueRemainingQty = d.requestedQuantity - alreadyAllocated;

        return {
          demandId: d.id,
          storeId: d.storeId,
          storeName: d.store.name,
          storePriority: d.store.priority,
          productId: d.productId,
          productName: d.product.name,
          requestedQty: trueRemainingQty,
        };
      })
      .filter((d) => d.requestedQty > 0);

    if (demands.length === 0) {
      return { success: true, message: "Tüm talepler zaten karşılanmış." };
    }

    // 3. Sadece stoğu 0'dan BÜYÜK olanları motora gönder
    const stocksDb = await prisma.warehouseStock.findMany({
      where: { quantity: { gt: 0 } },
      include: { warehouse: true, product: true },
    });

    const routesDb = await prisma.warehouseRoute.findMany();
    const warehousesDb = await prisma.warehouse.findMany();

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

    // 4. Dağıtımı Hesapla
    const result = runSmartAllocation(demands, stocks, routes, warehousesDb);

    // 5. DB Kaydı
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
        if (item.allocatedQty <= 0) continue;

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

        // Depo stoğunu fiziksel olarak düş
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

      // Talep Durumlarını Güncelle
      for (const demand of demandsDb) {
        const newlyAllocated = result.allocations
          .filter((a) => a.demandId === demand.id)
          .reduce((sum, curr) => sum + curr.allocatedQty, 0);

        const oldAllocated = demand.allocations.reduce(
          (sum, curr) => sum + curr.allocatedQty,
          0,
        );

        const total = oldAllocated + newlyAllocated;

        let newStatus = demand.status;
        if (total >= demand.requestedQuantity) {
          newStatus = "FULFILLED";
        } else if (total > 0) {
          newStatus = "PARTIAL";
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
  } catch (error: any) {
    console.error("Allocation hatası:", error);
    return { error: error?.message || "Dağıtım hesaplanamadı." };
  }
}

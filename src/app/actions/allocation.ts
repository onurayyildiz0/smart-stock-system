// src/app/actions/allocation.ts
"use server";

import { prisma } from "../lib/prisma";
import { runSmartAllocation } from "../lib/allocation-engine";
import { revalidatePath } from "next/cache";

export async function executeAllocationAction() {
  try {
    // 1. Veritabanından girdileri topla
    const demandsDb = await prisma.storeDemand.findMany({
      include: { store: true, product: true },
    });

    const stocksDb = await prisma.warehouseStock.findMany({
      include: { warehouse: true, product: true },
    });

    const routesDb = await prisma.warehouseRoute.findMany();

    // 2. Algoritmaya uygun formata dönüştür
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

    // 3. Algoritma Motorunu Çalıştır
    const result = runSmartAllocation(demands, stocks, routes);

    // 4. Sonuçları Veritabanına Transaction ile Kaydet
    await prisma.$transaction(async (tx) => {
      // Önceki geçmiş çalıştırmaları temizle (demo sade kalsın diye)
      await tx.allocationItem.deleteMany();
      await tx.allocationRun.deleteMany();

      // Yeni çalıştırma kaydı oluştur
      const run = await tx.allocationRun.create({
        data: {
          totalCost: result.totalCost,
          fulfillmentRate: result.fulfillmentRate,
          totalRequested: result.totalRequested,
          totalFulfilled: result.totalFulfilled,
        },
      });

      // Kalemleri kaydet
      if (result.allocations.length > 0) {
        await tx.allocationItem.createMany({
          data: result.allocations.map((item) => ({
            runId: run.id,
            demandId: item.demandId,
            warehouseId: item.warehouseId,
            productId: item.productId,
            allocatedQty: item.allocatedQty,
            unitCost: item.unitCost,
            totalCost: item.totalCost,
            deliveryDays: item.deliveryDays,
          })),
        });
      }
    });

    // 5. Sayfayı anında yenile
    revalidatePath("/");

    return { success: true, message: "Dağıtım başarıyla tamamlandı." };
  } catch (error) {
    console.error("Dağıtım hatası:", error);
    return { success: false, message: "Dağıtım sırasında bir hata oluştu." };
  }
}
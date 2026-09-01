"use server";

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateRouteAction(
  warehouseId: string, 
  storeId: string, 
  shippingCost: number, 
  deliveryDays: number
) {
  try {
    await prisma.warehouseRoute.upsert({
      where: {
        warehouseId_storeId: { warehouseId, storeId }
      },
      update: {
        shippingCost,
        deliveryDays
      },
      create: {
        warehouseId,
        storeId,
        shippingCost,
        deliveryDays
      }
    });
    revalidatePath("/logistics");
    return { success: true };
  } catch (error) {
    console.error("Rota güncelleme hatası:", error);
    return { success: false, error: "Rota güncellenemedi." };
  }
}
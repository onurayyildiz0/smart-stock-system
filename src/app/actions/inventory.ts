"use server";

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";

// Depodaki bir ürünün stoğunu güncelleme
export async function updateStockAction(stockId: string, newQuantity: number) {
  try {
    await prisma.warehouseStock.update({
      where: { id: stockId },
      data: { quantity: Math.max(0, newQuantity) }, // Negatif stok olmasın
    });
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Stok güncellenirken bir hata oluştu." };
  }
}

// Yeni bir depo ekleme
export async function addWarehouseAction(formData: FormData) {
  const name = formData.get("name") as string;
  const location = formData.get("location") as string;
  const capacity = parseInt(formData.get("capacity") as string);

  try {
    await prisma.warehouse.create({
      data: { name, location, capacity },
    });
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Depo eklenemedi." };
  }
}
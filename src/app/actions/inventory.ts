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

// Yeni bir ürün ekleme ve seçilen depoya başlangıç stoğunu tanımlama
export async function addProductAction(formData: FormData) {
  const name = formData.get("name") as string;
  const sku = formData.get("sku") as string;
  const category = formData.get("category") as string;
  const warehouseId = formData.get("warehouseId") as string;
  const initialQty = parseInt(formData.get("initialQty") as string);

  try {
    // Prisma'nın nested (içe içe) create özelliği ile hem ürünü hem de stoğu aynı anda oluşturuyoruz
    await prisma.product.create({
      data: {
        name,
        sku,
        category,
        // Ürün oluşurken aynı anda WarehouseStock tablosuna da bağlantılı kayıt atıyoruz
        stocks: {
          create: {
            warehouseId: warehouseId,
            quantity: Math.max(0, initialQty),
          },
        },
      },
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    // SKU (barkod) benzersiz (unique) olduğu için aynı SKU girilirse Prisma hata fırlatır
    return {
      success: false,
      error: "Ürün eklenemedi. SKU (Barkod) daha önce kullanılmış olabilir.",
    };
  }
}

// Depoyu tamamen silme
export async function deleteWarehouseAction(warehouseId: string) {
  try {
    await prisma.warehouse.delete({
      where: { id: warehouseId },
    });
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Depo silinirken bir hata oluştu." };
  }
}

// Bir ürünü (stoğu) o depodan silme
export async function deleteStockAction(stockId: string) {
  try {
    await prisma.warehouseStock.delete({
      where: { id: stockId },
    });
    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Ürün depodan silinirken bir hata oluştu.",
    };
  }
}

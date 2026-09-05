// src/app/actions/inventory.ts
"use server";

import { prisma } from "../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { revalidatePath } from "next/cache";

// Depoya yeni stok ekleme (Ürün sistemde yoksa otomatik oluşturur)
// src/app/actions/inventory.ts içinde ilgili kısım:

export async function addStockToWarehouseAction(formData: {
  warehouseId: string;
  productName: string;
  sku?: string;
  category?: string;
  price: number;
  quantity: number;
}) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "Yetkisiz işlem. Lütfen giriş yapın." };
    }

    const { warehouseId, productName, sku, category, price, quantity } =
      formData;

    // Fiyat ve miktar zorunluluk kontrolü
    if (
      !warehouseId ||
      !productName?.trim() ||
      quantity === undefined ||
      price === undefined ||
      price === null
    ) {
      return { error: "Lütfen gerekli tüm alanları doldurun." };
    }

    if (Number(price) <= 0) {
      return {
        error:
          "Birim maliyet 0 veya negatif olamaz. Lütfen geçerli bir fiyat girin.",
      };
    }

    if (Number(quantity) <= 0) {
      return { error: "Miktar en az 1 olmalıdır." };
    }

    const role = (session.user as any).role;
    const userWarehouseId = (session.user as any).warehouseId;

    if (role === "WAREHOUSE_MANAGER" && userWarehouseId !== warehouseId) {
      return {
        error: "Yalnızca yetkili olduğunuz depoya stok ekleyebilirsiniz.",
      };
    }

    const cleanProductName = productName.trim();

    // 1. Ürünü bul veya girilen zorunlu price değeriyle oluştur
    let product = await prisma.product.findFirst({
      where: { name: cleanProductName },
    });

    if (!product) {
      const generatedSku =
        sku?.trim() ||
        `SKU-${cleanProductName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      product = await prisma.product.create({
        data: {
          name: cleanProductName,
          sku: generatedSku,
          category: category?.trim() || "Genel",
          price: Number(price), // Kesinlikle girilen değer yazılır
        },
      });
    }

    // 2. Depo stoku oluştur veya miktarı güncelle
    const existingStock = await prisma.warehouseStock.findFirst({
      where: {
        warehouseId,
        productId: product.id,
      },
    });

    if (existingStock) {
      await prisma.warehouseStock.update({
        where: { id: existingStock.id },
        data: {
          quantity: existingStock.quantity + Math.max(1, Number(quantity)),
        },
      });
    } else {
      await prisma.warehouseStock.create({
        data: {
          warehouseId,
          productId: product.id,
          quantity: Math.max(1, Number(quantity)),
        },
      });
    }

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Stok ekleme hatası:", error);
    return { error: "Stok eklenirken bir hata oluştu." };
  }
}

// Depodaki ürün miktarını güncelleme
export async function updateStockQuantityAction(
  stockId: string,
  quantity: number,
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "Yetkisiz işlem." };
    }

    const stock = await prisma.warehouseStock.findUnique({
      where: { id: stockId },
    });

    if (!stock) {
      return { error: "Stok bulunamadı." };
    }

    const role = (session.user as any).role;
    const userWarehouseId = (session.user as any).warehouseId;

    if (role === "WAREHOUSE_MANAGER" && userWarehouseId !== stock.warehouseId) {
      return {
        error: "Yalnızca kendi deponuzdaki stoğu güncelleyebilirsiniz.",
      };
    }

    await prisma.warehouseStock.update({
      where: { id: stockId },
      data: { quantity: Math.max(0, Number(quantity)) },
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Stok güncelleme hatası:", error);
    return { error: "Stok güncellenirken bir hata oluştu." };
  }
}

// Depodaki stoğu tamamen silme
export async function deleteStockAction(stockId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "Yetkisiz işlem." };
    }

    const stock = await prisma.warehouseStock.findUnique({
      where: { id: stockId },
    });

    if (!stock) {
      return { error: "Silinecek stok bulunamadı." };
    }

    const role = (session.user as any).role;
    const userWarehouseId = (session.user as any).warehouseId;

    if (role === "WAREHOUSE_MANAGER" && userWarehouseId !== stock.warehouseId) {
      return { error: "Yalnızca kendi deponuzdaki stoğu kaldırabilirsiniz." };
    }

    await prisma.warehouseStock.delete({
      where: { id: stockId },
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Stok silme hatası:", error);
    return { error: "Ürün depodan silinirken bir hata oluştu." };
  }
}

export async function updateStockAction(stockId: string, newQuantity: number) {
  return updateStockQuantityAction(stockId, newQuantity);
}

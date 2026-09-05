// src/app/actions/inventory.ts
"use server";

import { prisma } from "../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { revalidatePath } from "next/cache";

// Depoya yeni stok ekleme (Kapasite kontrollü)
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

    // Temel validasyonlar
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

    const addedQty = Number(quantity);
    if (addedQty <= 0) {
      return { error: "Miktar en az 1 olmalıdır." };
    }

    const role = session.user.role;
    const userWarehouseId = session.user.warehouseId;

    if (role === "WAREHOUSE_MANAGER" && userWarehouseId !== warehouseId) {
      return {
        error: "Yalnızca yetkili olduğunuz depoya stok ekleyebilirsiniz.",
      };
    }

    // 1. Depo Bilgisi ve Kapasite Kontrolü
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: { stocks: true },
    });

    if (!warehouse) {
      return { error: "Hedef depo bulunamadı." };
    }

    const currentTotalStock = warehouse.stocks.reduce(
      (sum, s) => sum + s.quantity,
      0,
    );

    if (currentTotalStock + addedQty > warehouse.capacity) {
      const remainingSpace = Math.max(
        0,
        warehouse.capacity - currentTotalStock,
      );
      return {
        error: `Depo kapasitesi aşılıyor! (Maksimum: ${warehouse.capacity}, Mevcut: ${currentTotalStock}, Kalan Alan: ${remainingSpace})`,
      };
    }

    const cleanProductName = productName.trim();

    // 2. Ürünü bul veya girilen değerle oluştur
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
          price: Number(price),
        },
      });
    }

    // 3. Depo stoku oluştur veya miktarı güncelle
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
          quantity: existingStock.quantity + addedQty,
        },
      });
    } else {
      await prisma.warehouseStock.create({
        data: {
          warehouseId,
          productId: product.id,
          quantity: addedQty,
        },
      });
    }

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("Stok ekleme hatası:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Stok eklenirken bir hata oluştu.";
    return { error: message };
  }
}

// Depodaki ürün miktarını güncelleme (Kapasite kontrollü)
export async function updateStockQuantityAction(
  stockId: string,
  quantity: number,
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "Yetkisiz işlem." };
    }

    const targetQty = Math.max(0, Number(quantity));

    const stock = await prisma.warehouseStock.findUnique({
      where: { id: stockId },
      include: {
        warehouse: {
          include: { stocks: true },
        },
      },
    });

    if (!stock) {
      return { error: "Stok bulunamadı." };
    }

    const role = session.user.role;
    const userWarehouseId = session.user.warehouseId;

    if (role === "WAREHOUSE_MANAGER" && userWarehouseId !== stock.warehouseId) {
      return {
        error: "Yalnızca kendi deponuzdaki stoğu güncelleyebilirsiniz.",
      };
    }

    // Kapasite Kontrolü (Diğer ürünlerin toplamı + yeni miktar)
    const otherStocksTotal = stock.warehouse.stocks
      .filter((s) => s.id !== stock.id)
      .reduce((sum, s) => sum + s.quantity, 0);

    if (otherStocksTotal + targetQty > stock.warehouse.capacity) {
      const remainingSpace = Math.max(
        0,
        stock.warehouse.capacity - otherStocksTotal,
      );
      return {
        error: `Güncellenen miktar depo kapasitesini aşıyor! (Depo Limiti: ${stock.warehouse.capacity}, Bu ürün için ayrılabilecek maks: ${remainingSpace})`,
      };
    }

    await prisma.warehouseStock.update({
      where: { id: stockId },
      data: { quantity: targetQty },
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("Stok güncelleme hatası:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Stok güncellenirken bir hata oluştu.";
    return { error: message };
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

    const role = session.user.role;
    const userWarehouseId = session.user.warehouseId;

    if (role === "WAREHOUSE_MANAGER" && userWarehouseId !== stock.warehouseId) {
      return { error: "Yalnızca kendi deponuzdaki stoğu kaldırabilirsiniz." };
    }

    await prisma.warehouseStock.delete({
      where: { id: stockId },
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("Stok silme hatası:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Ürün depodan silinirken bir hata oluştu.";
    return { error: message };
  }
}

export async function updateStockAction(stockId: string, newQuantity: number) {
  return updateStockQuantityAction(stockId, newQuantity);
}

// Depo Ekleme Action
// Depo Ekleme Action (FormData ve Obje Uyumlu)
export async function addWarehouseAction(
  input:
    | FormData
    | {
        name: string;
        location: string;
        capacity: number;
      },
) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return { error: "Yalnızca Admin yeni depo ekleyebilir." };
    }

    let name = "";
    let location = "";
    let capacity = 0;

    if (input instanceof FormData) {
      name = (input.get("name") as string) || "";
      location = (input.get("location") as string) || "";
      capacity = Number(input.get("capacity")) || 0;
    } else {
      name = input.name || "";
      location = input.location || "";
      capacity = Number(input.capacity) || 0;
    }

    if (!name.trim() || !location.trim() || capacity <= 0) {
      return { error: "Lütfen geçerli depo bilgileri girin." };
    }

    await prisma.warehouse.create({
      data: {
        name: name.trim(),
        location: location.trim(),
        capacity,
      },
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("Depo ekleme hatası:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Depo eklenirken bir hata oluştu.";
    return { error: message };
  }
}

// Ürün Ekleme Action (FormData ve Obje Uyumlu)
export async function addProductAction(
  input:
    | FormData
    | {
        name: string;
        sku?: string;
        category?: string;
        price: number;
      },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: "Yetkisiz işlem. Lütfen giriş yapın." };
    }

    let name = "";
    let sku = "";
    let category = "Genel";
    let price = 0;

    if (input instanceof FormData) {
      name = (input.get("name") as string) || "";
      sku = (input.get("sku") as string) || "";
      category = (input.get("category") as string) || "Genel";
      price = Number(input.get("price")) || 0;
    } else {
      name = input.name || "";
      sku = input.sku || "";
      category = input.category || "Genel";
      price = Number(input.price) || 0;
    }

    if (!name.trim() || price <= 0) {
      return { error: "Geçerli bir ürün adı ve fiyat giriniz." };
    }

    const cleanName = name.trim();
    const generatedSku =
      sku.trim() ||
      `SKU-${cleanName.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    await prisma.product.create({
      data: {
        name: cleanName,
        sku: generatedSku,
        category: category.trim() || "Genel",
        price,
      },
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("Ürün ekleme hatası:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Ürün eklenirken bir hata oluştu.";
    return { error: message };
  }
}

// Depo Silme Action
export async function deleteWarehouseAction(warehouseId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return { error: "Yalnızca Admin depo silebilir." };
    }

    if (!warehouseId) {
      return { error: "Depo ID bulunamadı." };
    }

    await prisma.warehouse.delete({
      where: { id: warehouseId },
    });

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error: unknown) {
    console.error("Depo silme hatası:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Depo silinirken bir hata oluştu.";
    return { error: message };
  }
}

// src/app/actions/auth.ts
"use server";

import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUserAction(formData: {
  name: string;
  email: string;
  password: string;
  role: "STORE_MANAGER" | "WAREHOUSE_MANAGER";
  storeName?: string;
  warehouseName?: string;
}) {
  try {
    const { name, email, password, role, storeName, warehouseName } = formData;

    if (!name || !email || !password || !role) {
      return { error: "Lütfen zorunlu alanları doldurun." };
    }

    if (role === "STORE_MANAGER" && !storeName?.trim()) {
      return { error: "Lütfen bağlı olduğunuz mağaza adını girin." };
    }

    if (role === "WAREHOUSE_MANAGER" && !warehouseName?.trim()) {
      return { error: "Lütfen bağlı olduğunuz depo adını girin." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Bu e-posta adresiyle kayıtlı bir hesap zaten var." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let targetStoreId: string | null = null;
    let targetWarehouseId: string | null = null;

    // Mağaza Müdürü ise: İsimle ara, yoksa otomatik oluştur
    if (role === "STORE_MANAGER" && storeName) {
      const cleanStoreName = storeName.trim();
      let store = await prisma.store.findFirst({
        where: { name: cleanStoreName },
      });

      if (!store) {
        store = await prisma.store.create({
          data: {
            name: cleanStoreName,
            location: cleanStoreName,
            priority: 2, // Varsayılan orta öncelik
          },
        });
      }
      targetStoreId = store.id;
    }

    // Depo Müdürü ise: İsimle ara, yoksa otomatik oluştur
    if (role === "WAREHOUSE_MANAGER" && warehouseName) {
      const cleanWarehouseName = warehouseName.trim();
      let warehouse = await prisma.warehouse.findFirst({
        where: { name: cleanWarehouseName },
      });

      if (!warehouse) {
        warehouse = await prisma.warehouse.create({
          data: {
            name: cleanWarehouseName,
            location: cleanWarehouseName,
            capacity: 1000, // Varsayılan kapasite
          },
        });
      }
      targetWarehouseId = warehouse.id;
    }

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isApproved: false, // Yönetici onayı bekleyecek
        storeId: targetStoreId,
        warehouseId: targetWarehouseId,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Kayıt hatası:", error);
    return { error: "Kayıt işlemi sırasında bir hata oluştu." };
  }
}

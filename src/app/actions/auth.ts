// src/app/actions/auth.ts
"use server";

import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

export async function registerUserAction(formData: {
  name: string;
  email: string;
  password: string;
  role: "STORE_MANAGER" | "WAREHOUSE_MANAGER";
  storeId?: string;
  warehouseId?: string;
}) {
  try {
    const { name, email, password, role, storeId, warehouseId } = formData;

    if (!name || !email || !password || !role) {
      return { error: "Lütfen zorunlu alanları doldurun." };
    }

    if (role === "STORE_MANAGER" && !storeId) {
      return { error: "Lütfen bir mağaza seçin." };
    }

    if (role === "WAREHOUSE_MANAGER" && !warehouseId) {
      return { error: "Lütfen bir depo seçin." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Bu e-posta adresiyle kayıtlı bir hesap zaten var." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        isApproved: false, // Yönetici onayı bekleyecek
        storeId: role === "STORE_MANAGER" ? storeId : null,
        warehouseId: role === "WAREHOUSE_MANAGER" ? warehouseId : null,
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Kayıt hatası:", error);
    return { error: "Kayıt işlemi sırasında bir hata oluştu." };
  }
}

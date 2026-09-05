// src/app/actions/store.ts
"use server";

import { prisma } from "../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { revalidatePath } from "next/cache";

export async function updateStorePriority(storeId: string, priority: number) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "WAREHOUSE_MANAGER" && userRole !== "ADMIN") {
      return { error: "Öncelik güncelleme yetkiniz bulunmuyor." };
    }

    if (!storeId || isNaN(priority)) {
      return { error: "Geçersiz mağaza veya öncelik değeri." };
    }

    await prisma.store.update({
      where: { id: storeId },
      data: { priority: Math.max(1, Number(priority)) },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Öncelik güncelleme hatası:", error);
    return { error: "Öncelik güncellenirken bir hata oluştu." };
  }
}

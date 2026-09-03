"use server";

import { prisma } from "../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";
import { revalidatePath } from "next/cache";

export async function updateStorePriority(storeId: string, priority: number) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role;

  // Sadece WAREHOUSE_MANAGER güncelleyebilir
  if (userRole !== "WAREHOUSE_MANAGER") {
    throw new Error("Bu işlem için yetkiniz yok.");
  }

  await prisma.store.update({
    where: { id: storeId },
    data: { priority: Number(priority) },
  });

  revalidatePath("/");
}

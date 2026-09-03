// src/app/actions/user.ts
"use server";

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "../lib/auth";

export async function approveUserAction(userId: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isApproved: true },
  });

  revalidatePath("/");
  return { success: true };
}

export async function rejectUserAction(userId: string) {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") {
    return { error: "Yetkisiz işlem." };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/");
  return { success: true };
}

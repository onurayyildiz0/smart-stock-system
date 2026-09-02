// src/actions/demand.ts
"use server";

import { prisma } from "../lib/prisma";
import { revalidatePath } from "next/cache";

export async function createDemandAction(formData: FormData) {
  const storeId = formData.get("storeId") as string;
  const productId = formData.get("productId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);

  if (!storeId || !productId || isNaN(quantity) || quantity <= 0) {
    return {
      success: false,
      message: "Lütfen tüm alanları geçerli şekilde doldurun.",
    };
  }

  try {
    await prisma.storeDemand.create({
      data: {
        storeId,
        productId,
        requestedQuantity: quantity,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Talep ekleme hatası:", error);
    return { success: false, message: "Talep eklenirken bir hata oluştu." };
  }
}

export async function deleteDemandAction(demandId: string) {
  try {
    await prisma.storeDemand.delete({
      where: { id: demandId },
    });
    // Anasayfayı yenile ki silinen talep ekrandan kaybolsun
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Talep silinirken bir hata oluştu." };
  }
}

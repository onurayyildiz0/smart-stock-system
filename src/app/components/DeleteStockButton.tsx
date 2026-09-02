"use client";

import { Trash2 } from "lucide-react";
import { deleteStockAction } from "../actions/inventory";

export default function DeleteStockButton({ stockId }: { stockId: string }) {
  async function handleDelete() {
    if (
      !confirm("Bu ürünü depodan tamamen kaldırmak istediğinize emin misiniz?")
    )
      return;

    const result = await deleteStockAction(stockId);
    if (!result.success) alert(result.error);
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
      title="Ürünü Sil"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

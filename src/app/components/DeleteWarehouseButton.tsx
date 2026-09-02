"use client";

import { Trash2 } from "lucide-react";
import { deleteWarehouseAction } from "../actions/inventory";

export default function DeleteWarehouseButton({
  warehouseId,
}: {
  warehouseId: string;
}) {
  async function handleDelete() {
    if (
      !confirm(
        "Bu depoyu silmek istediğinize emin misiniz? DİKKAT: Depo içindeki tüm stoklar da silinecektir!",
      )
    )
      return;

    const result = await deleteWarehouseAction(warehouseId);
    if (!result.success) alert(result.error);
  }

  return (
    <button
      onClick={handleDelete}
      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
      title="Depoyu Sil"
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}

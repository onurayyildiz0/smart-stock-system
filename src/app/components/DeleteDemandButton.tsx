"use client";

import { Trash2 } from "lucide-react";
import { deleteDemandAction } from "../actions/demand";

export default function DeleteDemandButton({ demandId }: { demandId: string }) {
  async function handleDelete() {
    if (!confirm("Bu talebi iptal etmek istediğinize emin misiniz?")) return;

    const result = await deleteDemandAction(demandId);
    if (!result.success) {
      alert(result.error);
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
      title="Talebi İptal Et"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}

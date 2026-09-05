"use client";

import { useState } from "react";
import {
  updateStockQuantityAction,
  deleteStockAction,
} from "../actions/inventory";
import { Trash2, Check, Loader2 } from "lucide-react";

interface Props {
  stockId: string;
  initialQuantity: number;
}

export default function StockRowActions({ stockId, initialQuantity }: Props) {
  const [quantity, setQuantity] = useState(initialQuantity);
  const [loading, setLoading] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    await updateStockQuantityAction(stockId, quantity);
    setLoading(false);
    setHasChanged(false);
  };

  const handleDelete = async () => {
    if (
      confirm("Bu ürünü depodan tamamen kaldırmak istediğinize emin misiniz?")
    ) {
      setLoading(true);
      await deleteStockAction(stockId);
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        value={quantity}
        onChange={(e) => {
          setQuantity(Number(e.target.value));
          setHasChanged(true);
        }}
        className="w-16 px-2 py-1 border border-slate-300 rounded text-xs text-slate-900 outline-none focus:border-indigo-600 text-center"
      />

      {hasChanged && (
        <button
          onClick={handleUpdate}
          disabled={loading}
          title="Kaydet"
          className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={loading}
        title="Stoğu Kaldır"
        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition disabled:opacity-50 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

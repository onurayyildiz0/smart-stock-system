"use client";

import { useState } from "react";
import { updateStockAction } from "../actions/inventory";
import { Check, RefreshCcw } from "lucide-react";

export default function StockUpdateForm({ stockId, initialQty }: { stockId: string, initialQty: number }) {
  // Değeri string olarak tutmak "NaN" hatasını kökten çözer
  const [qty, setQty] = useState<string>(initialQty.toString());
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    const numValue = parseInt(qty);
    if (isNaN(numValue)) return;

    setLoading(true);
    try {
      await updateStockAction(stockId, numValue);
      // Başarılı olduktan sonra state'i de güncelle (isteğe bağlı)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <input 
        type="number" 
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        className="w-20 px-2 py-1 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <button 
        onClick={handleUpdate}
        disabled={loading || parseInt(qty) === initialQty}
        className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-30 transition-all"
      >
        {loading ? <RefreshCcw size={16} className="animate-spin" /> : <Check size={16} />}
      </button>
    </div>
  );
}
"use client";

import { useState } from "react";
import { updateRouteAction } from "../actions/logistics";
import { Check, RefreshCcw } from "lucide-react";

export default function RouteUpdateForm({ 
  warehouseId, storeId, initialCost, initialDays 
}: { 
  warehouseId: string, storeId: string, initialCost: number, initialDays: number 
}) {
  const [cost, setCost] = useState(initialCost);
  const [days, setDays] = useState(initialDays);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    await updateRouteAction(warehouseId, storeId, cost, days);
    setLoading(false);
  };

  const isChanged = cost !== initialCost || days !== initialDays;

  return (
    <>
      <td className="px-6 py-4 text-center">
        <input 
          type="number" 
          step="0.1"
          value={cost}
          onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
          className="w-20 px-2 py-1 border border-slate-200 rounded text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </td>
      <td className="px-6 py-4 text-center">
        <input 
          type="number" 
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value) || 0)}
          className="w-16 px-2 py-1 border border-slate-200 rounded text-sm text-center focus:ring-2 focus:ring-indigo-500 focus:outline-none"
        />
      </td>
      <td className="px-6 py-4 text-right">
        <button 
          onClick={handleUpdate}
          disabled={loading || !isChanged}
          className={`p-1.5 rounded transition-all ${
            isChanged 
              ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {loading ? <RefreshCcw size={14} className="animate-spin" /> : <Check size={14} />}
        </button>
      </td>
    </>
  );
}
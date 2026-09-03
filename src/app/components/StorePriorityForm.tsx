"use client";

import { useState } from "react";
import { updateStorePriority } from "@/app/actions/store";

export default function StorePriorityForm({
  storeId,
  initialPriority,
  canEdit,
}: {
  storeId: string;
  initialPriority: number;
  canEdit: boolean;
}) {
  const [priority, setPriority] = useState(initialPriority);
  const [loading, setLoading] = useState(false);

  if (!canEdit) {
    return (
      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
        Öncelik: {initialPriority}
      </span>
    );
  }

  const handleBlur = async () => {
    if (priority === initialPriority) return;
    setLoading(true);
    await updateStorePriority(storeId, priority);
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={priority}
        onChange={(e) => setPriority(Number(e.target.value))}
        onBlur={handleBlur}
        disabled={loading}
        className="w-16 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        title="Öncelik değeri (Yüksek sayı = yüksek öncelik)"
      />
      {loading && <span className="text-[10px] text-slate-400">...</span>}
    </div>
  );
}

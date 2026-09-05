"use client";

import { useState, useTransition } from "react";
import { updateStorePriority } from "@/app/actions/store";
import { Loader2 } from "lucide-react";

interface Props {
  storeId: string;
  initialPriority: number;
  canEdit: boolean;
}

export default function StorePriorityForm({
  storeId,
  initialPriority = 1,
  canEdit,
}: Props) {
  const [priority, setPriority] = useState<number>(initialPriority);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPriority = Number(e.target.value);
    const previous = priority;
    setPriority(newPriority);

    startTransition(async () => {
      const res = await updateStorePriority(storeId, newPriority);
      if (res?.error) {
        alert(res.error);
        setPriority(previous); // Hata durumunda eski değere geri al
      }
    });
  };

  if (!canEdit) {
    const badges: Record<number, { text: string; style: string }> = {
      1: { text: "1 - Düşük", style: "bg-slate-100 text-slate-600" },
      2: { text: "2 - Normal", style: "bg-blue-50 text-blue-700" },
      3: { text: "3 - Yüksek", style: "bg-amber-50 text-amber-700" },
      4: { text: "4 - Kritik", style: "bg-rose-50 text-rose-700 font-bold" },
    };

    const currentBadge = badges[priority] || {
      text: `Öncelik: ${priority}`,
      style: "bg-slate-100 text-slate-700",
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs ${currentBadge.style}`}>
        {currentBadge.text}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={priority}
        disabled={isPending}
        onChange={handleChange}
        className="text-xs bg-white border border-slate-300 rounded-lg px-2 py-1 text-slate-800 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 cursor-pointer font-medium disabled:opacity-50"
      >
        <option value={1}>1 (Düşük)</option>
        <option value={2}>2 (Normal)</option>
        <option value={3}>3 (Yüksek)</option>
        <option value={4}>4 (Kritik)</option>
      </select>
      {isPending && (
        <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
      )}
    </div>
  );
}

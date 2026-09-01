// src/components/RunButton.tsx
"use client";

import React, { useTransition } from "react";
import { Play, Loader2 } from "lucide-react";
import { executeAllocationAction } from "../actions/allocation";

export default function RunButton() {
  const [isPending, startTransition] = useTransition();

  const handleRun = () => {
    startTransition(async () => {
      await executeAllocationAction();
    });
  };

  return (
    <button
      onClick={handleRun}
      disabled={isPending}
      className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium px-5 py-2.5 rounded-xl transition shadow-sm hover:shadow active:scale-95 cursor-pointer disabled:cursor-not-allowed"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Hesaplanıyor...
        </>
      ) : (
        <>
          <Play className="w-4 h-4 fill-white" />
          Optimizasyonu Çalıştır
        </>
      )}
    </button>
  );
}
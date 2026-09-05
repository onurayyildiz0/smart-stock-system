"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2 } from "lucide-react";
import { runAllocationAction } from "../actions/allocation";

export default function RunButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleRun = async () => {
    try {
      console.log("Optimizasyon başlatıldı...");
      const result = await runAllocationAction();
      console.log("Optimizasyon sonucu:", result);

      if (result && "error" in result && result.error) {
        alert("Hata: " + result.error);
        return;
      }

      // Veritabanı yazıldıktan sonra arayüzü zorla tazele
      startTransition(() => {
        router.refresh();
      });
    } catch (err: unknown) {
      console.error("Action çağrısında hata:", err);
      const message = err instanceof Error ? err.message : "Bilinmeyen hata";
      alert("Hata oluştu: " + message);
    }
  };

  return (
    <button
      onClick={handleRun}
      disabled={isPending}
      className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition text-xs sm:text-sm font-semibold shadow-sm disabled:opacity-50 cursor-pointer"
    >
      {isPending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Hesaplanıyor...</span>
        </>
      ) : (
        <>
          <Play className="w-4 h-4 fill-white" />
          <span>Optimizasyonu Çalıştır</span>
        </>
      )}
    </button>
  );
}

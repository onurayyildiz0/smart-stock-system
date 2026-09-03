"use client";

import { useTransition } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { approveUserAction, rejectUserAction } from "../actions/user";

export default function UserApprovalButtons({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = () => {
    startTransition(async () => {
      await approveUserAction(userId);
      // return yazmıyoruz, void kalıyor
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectUserAction(userId);
      // return yazmıyoruz, void kalıyor
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={handleApprove}
        className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition disabled:opacity-50"
        title="Onayla"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
      </button>

      <button
        type="button"
        disabled={isPending}
        onClick={handleReject}
        className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition disabled:opacity-50"
        title="Reddet / Sil"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

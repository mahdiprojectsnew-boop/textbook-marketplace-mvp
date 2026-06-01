"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function RequestActionButtons({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accepted" | "declined" | null>(null);

  async function updateStatus(status: "accepted" | "declined") {
    setLoading(status);

    const res = await fetch(`/api/transactions/${transactionId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    setLoading(null);

    if (!res.ok) {
      alert("Failed to update request");
      return;
    }

    router.refresh();
  }

  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        disabled={loading !== null}
        onClick={() => updateStatus("accepted")}
        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition disabled:opacity-60"
      >
        <CheckCircle2 size={15} />
        {loading === "accepted" ? "Accepting..." : "Accept"}
      </button>

      <button
        type="button"
        disabled={loading !== null}
        onClick={() => updateStatus("declined")}
        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition disabled:opacity-60"
      >
        <XCircle size={15} />
        {loading === "declined" ? "Declining..." : "Decline"}
      </button>
    </div>
  );
}
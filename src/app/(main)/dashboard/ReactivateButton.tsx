"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReactivateButton({ listingId }: { listingId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReactivate() {
    if (loading) return;

    setLoading(true);

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      if (!res.ok) return;

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleReactivate}
      disabled={loading}
      className="px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 disabled:opacity-50"
    >
      {loading ? "Reactivating..." : "Reactivate"}
    </button>
  );
}
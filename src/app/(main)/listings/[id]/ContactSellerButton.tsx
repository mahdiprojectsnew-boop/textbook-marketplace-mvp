"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2, LogIn } from "lucide-react";
import Link from "next/link";

interface Props {
  listingId: string;
  listingType: "sale" | "rental";
  isOwnListing: boolean;
  isLoggedIn: boolean;
}

export function ContactSellerButton({ listingId, listingType, isOwnListing, isLoggedIn }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // If not logged in — show login prompt
  if (!isLoggedIn) {
    return (
      <Link
        href={`/login?next=/listings/${listingId}`}
        className="w-full py-2.5 px-4 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition flex items-center justify-center gap-2"
      >
        <LogIn size={15} />
        Sign in to contact seller
      </Link>
    );
  }

  // If viewing own listing — show disabled state
  if (isOwnListing) {
    return (
      <div className="w-full py-2.5 px-4 bg-[#f1f5f9] text-[#94a3b8] text-sm font-medium rounded-lg flex items-center justify-center gap-2 cursor-not-allowed select-none">
        <MessageCircle size={15} />
        This is your listing
      </div>
    );
  }

  async function handleContact() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
      router.push(`/messages/${data.conversation_id}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <button
        onClick={handleContact}
        disabled={loading}
        className="w-full py-2.5 px-4 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading
          ? <><Loader2 size={15} className="animate-spin" />Opening…</>
          : <><MessageCircle size={15} />{listingType === "sale" ? "Contact Seller" : "Request Rental"}</>
        }
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}

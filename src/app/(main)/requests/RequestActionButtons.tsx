"use client";

export function RequestActionButtons({ transactionId }: { transactionId: string }) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={() => alert("ACCEPT CLICKED: " + transactionId)}
        className="flex-1 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold"
      >
        Accept
      </button>

      <button
        type="button"
        onClick={() => alert("DECLINE CLICKED: " + transactionId)}
        className="flex-1 px-4 py-2.5 rounded-xl bg-red-100 text-red-700 text-sm font-semibold"
      >
        Decline
      </button>
    </div>
  );
}
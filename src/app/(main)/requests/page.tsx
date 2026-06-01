import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  ArrowRight,
} from "lucide-react";

function money(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `$${Number(value).toFixed(2)}`;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

async function updateTransactionStatus(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const transactionId = String(formData.get("transaction_id") || "");
  const action = String(formData.get("action") || "");

  if (!transactionId || !["accepted", "declined"].includes(action)) {
    redirect("/requests?error=invalid");
  }

  const { data: transaction, error: findError } = await supabase
    .from("transactions")
    .select("id, seller_id, listing_id, transaction_type")
    .eq("id", transactionId)
    .eq("seller_id", user.id)
    .single();

  if (findError || !transaction) {
    redirect("/requests?error=notfound");
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      status: action,
      updated_at: new Date().toISOString(),
    })
    .eq("id", transactionId)
    .eq("seller_id", user.id);

  if (updateError) {
    console.error("UPDATE TRANSACTION ERROR:", updateError);
    redirect("/requests?error=save");
  }

  if (action === "accepted") {
    await supabase
      .from("listings")
      .update({
        status: transaction.transaction_type === "rental" ? "pending" : "pending",
      })
      .eq("id", transaction.listing_id)
      .eq("seller_id", user.id);
  }

  revalidatePath("/requests");
  revalidatePath("/dashboard");
  redirect("/requests?success=1");
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: incoming } = await supabase
    .from("transactions")
    .select(`
      id,
      status,
      transaction_type,
      amount,
      deposit_amount,
      created_at,
      listings (
        id,
        listing_type,
        price,
        books (
          title,
          author
        )
      ),
      buyer:users!transactions_buyer_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false });

  const { data: outgoing } = await supabase
    .from("transactions")
    .select(`
      id,
      status,
      transaction_type,
      amount,
      deposit_amount,
      created_at,
      listings (
        id,
        listing_type,
        price,
        books (
          title,
          author
        )
      ),
      seller:users!transactions_seller_id_fkey (
        id,
        first_name,
        last_name
      )
    `)
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false });

  const incomingRequests = (incoming ?? []) as any[];
  const outgoingRequests = (outgoing ?? []) as any[];

  return (
    <div
      className="min-h-screen bg-[#f8fafc]"
      style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
    >
      <div className="max-w-5xl mx-auto px-5 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] mb-6"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-[#0f172a]">Requests</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Manage textbook rental and purchase requests.
          </p>
        </div>

        {params?.success === "1" && (
          <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-800">
            Request updated successfully.
          </div>
        )}

        {params?.error && (
          <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
            Something went wrong. Please try again.
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          <section>
            <h2 className="text-base font-bold text-[#0f172a] mb-3">
              Incoming Requests
            </h2>

            {incomingRequests.length === 0 ? (
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
                <BookOpen
                  size={28}
                  className="text-[#94a3b8] mx-auto mb-3"
                />
                <p className="font-semibold text-[#334155]">
                  No incoming requests yet
                </p>
                <p className="text-sm text-[#94a3b8] mt-1">
                  When someone requests your book, it will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {incomingRequests.map((tx) => {
                  const book = tx.listings?.books;
                  const buyerName = tx.buyer?.first_name
                    ? `${tx.buyer.first_name} ${tx.buyer.last_name ?? ""}`.trim()
                    : "Buyer";

                  return (
                    <div
                      key={tx.id}
                      className="bg-white border border-[#e5e7eb] rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-[#0f172a]">
                            {book?.title ?? "Untitled Book"}
                          </p>
                          <p className="text-xs text-[#64748b] mt-1">
                            From {buyerName} · {formatDate(tx.created_at)}
                          </p>
                        </div>

                        <StatusBadge status={tx.status} />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <InfoBox
                          label="Type"
                          value={
                            tx.transaction_type === "purchase"
                              ? "Purchase"
                              : "Rental"
                          }
                        />
                        <InfoBox label="Amount" value={money(tx.amount)} />
                        <InfoBox
                          label="Deposit"
                          value={money(tx.deposit_amount)}
                        />
                        <InfoBox
                          label="Listing"
                          value={tx.listings?.listing_type ?? "—"}
                        />
                      </div>

                      {tx.status === "pending" && (
                        <div className="mt-4 flex gap-2">
                          <form action={updateTransactionStatus} className="flex-1">
                            <input
                              type="hidden"
                              name="transaction_id"
                              value={tx.id}
                            />
                            <input type="hidden" name="action" value="accepted" />
                            <button
                              type="submit"
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
                            >
                              <CheckCircle2 size={15} />
                              Accept
                            </button>
                          </form>

                          <form action={updateTransactionStatus} className="flex-1">
                            <input
                              type="hidden"
                              name="transaction_id"
                              value={tx.id}
                            />
                            <input type="hidden" name="action" value="declined" />
                            <button
                              type="submit"
                              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-700 text-sm font-semibold hover:bg-red-100 transition"
                            >
                              <XCircle size={15} />
                              Decline
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section>
            <h2 className="text-base font-bold text-[#0f172a] mb-3">
              My Sent Requests
            </h2>

            {outgoingRequests.length === 0 ? (
              <div className="bg-white border border-[#e5e7eb] rounded-xl p-8 text-center">
                <Clock size={28} className="text-[#94a3b8] mx-auto mb-3" />
                <p className="font-semibold text-[#334155]">
                  No sent requests yet
                </p>
                <p className="text-sm text-[#94a3b8] mt-1">
                  Books you request will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {outgoingRequests.map((tx) => {
                  const book = tx.listings?.books;
                  const sellerName = tx.seller?.first_name
                    ? `${tx.seller.first_name} ${tx.seller.last_name ?? ""}`.trim()
                    : "Seller";

                  return (
                    <Link
                      key={tx.id}
                      href={`/listings/${tx.listings?.id}`}
                      className="block bg-white border border-[#e5e7eb] rounded-xl p-4 hover:border-[#93c5fd] hover:shadow-sm transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-[#0f172a]">
                            {book?.title ?? "Untitled Book"}
                          </p>
                          <p className="text-xs text-[#64748b] mt-1">
                            To {sellerName} · {formatDate(tx.created_at)}
                          </p>
                        </div>

                        <StatusBadge status={tx.status} />
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs text-[#64748b]">
                        <span>
                          {tx.transaction_type === "purchase"
                            ? "Purchase"
                            : "Rental"}{" "}
                          · {money(tx.amount)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#1d4ed8] font-semibold">
                          View listing <ArrowRight size={12} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#f8fafc] border border-[#e5e7eb] p-3">
      <p className="text-[11px] text-[#94a3b8] font-semibold">{label}</p>
      <p className="text-sm text-[#0f172a] font-bold mt-0.5">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta =
    status === "accepted"
      ? {
          label: "Accepted",
          className: "bg-green-50 text-green-700",
        }
      : status === "declined"
      ? {
          label: "Declined",
          className: "bg-red-50 text-red-700",
        }
      : status === "completed"
      ? {
          label: "Completed",
          className: "bg-blue-50 text-blue-700",
        }
      : {
          label: "Pending",
          className: "bg-amber-50 text-amber-700",
        };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
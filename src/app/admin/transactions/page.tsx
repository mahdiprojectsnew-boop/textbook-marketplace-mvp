import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";
import { createClient } from "@supabase/supabase-js";
import {
  Search,
  CreditCard,
  User,
  BookOpen,
  Calendar,
  DollarSign,
  Info,
} from "lucide-react";
import { updateTransactionStatus } from "./actions";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function money(value: any) {
  const num = Number(value || 0);
  return `$${num.toFixed(2)}`;
}

function date(value: any) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function datetime(value: any) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function text(value: any) {
  return value || "—";
}

function userName(user: any) {
  if (!user) return "—";

  const firstName = user.first_name || "";
  const lastName = user.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || "—";
}

function statusClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "accepted":
      return "bg-blue-100 text-blue-800";
    case "completed":
      return "bg-green-100 text-green-800";
    case "cancelled":
      return "bg-red-100 text-red-800";
    case "declined":
      return "bg-red-100 text-red-800";
    case "disputed":
      return "bg-orange-100 text-orange-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function AdminTransactionsPage(props: any) {
  const searchParams = await Promise.resolve(props.searchParams || {});
  const q = String(searchParams.q || "").trim().toLowerCase();
  const statusFilter = String(searchParams.status || "");

  let query = supabaseAdmin
    .from("transactions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: transactions, error } = await query;

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Transactions Error</h1>
        <p className="mt-3 text-sm text-gray-700">{error.message}</p>
      </div>
    );
  }

  const listingIds = [
    ...new Set((transactions || []).map((t) => t.listing_id).filter(Boolean)),
  ];

  const userIds = [
    ...new Set(
      (transactions || [])
        .flatMap((t) => [t.buyer_id, t.seller_id])
        .filter(Boolean)
    ),
  ];

  const { data: listings } =
    listingIds.length > 0
      ? await supabaseAdmin.from("listings").select("*").in("id", listingIds)
      : { data: [] };

  const { data: users } =
    userIds.length > 0
      ? await supabaseAdmin.from("users").select("*").in("id", userIds)
      : { data: [] };

  const bookIds = [
    ...new Set((listings || []).map((l: any) => l.book_id).filter(Boolean)),
  ];

  const { data: books } =
    bookIds.length > 0
      ? await supabaseAdmin.from("books").select("*").in("id", bookIds)
      : { data: [] };

  const listingMap = new Map((listings || []).map((l: any) => [l.id, l]));
  const userMap = new Map((users || []).map((u: any) => [u.id, u]));
  const bookMap = new Map((books || []).map((b: any) => [b.id, b]));

  const rows = (transactions || []).filter((tx: any) => {
    if (!q) return true;

    const listing = listingMap.get(tx.listing_id) as any;
    const buyer = userMap.get(tx.buyer_id) as any;
    const seller = userMap.get(tx.seller_id) as any;
    const book = listing?.book_id ? (bookMap.get(listing.book_id) as any) : null;

    const searchable = [
      tx.id,
      tx.status,
      tx.transaction_type,
      listing?.title,
      listing?.book_title,
      book?.title,
      book?.isbn,
      buyer?.email,
      buyer?.first_name,
      buyer?.last_name,
      seller?.email,
      seller?.first_name,
      seller?.last_name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });

  return (
    <div className="p-8 space-y-8">
      <AdminPageHeader
  section="TRANSACTIONS"
  title="Transactions"
  description="Manage marketplace purchases, rentals, status updates, and payment activity."
/>
       
            {searchParams.updated && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800">
          Transaction status updated successfully to{" "}
          <span className="font-bold">{String(searchParams.updated).replaceAll("_", " ")}</span>.
        </div>
      )}

      {searchParams.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          Error: {String(searchParams.error).replaceAll("_", " ")}
        </div>
      )}
      <form className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by buyer, seller, book, listing, status..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm"
          />
        </div>

        <select
          name="status"
          defaultValue={statusFilter}
          className="px-4 py-2.5 border rounded-xl text-sm"
        >
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="disputed">Disputed</option>
        </select>

        <button className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-semibold">
          Filter
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">Showing</p>
          <p className="text-2xl font-bold">{rows.length}</p>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">Total Loaded</p>
          <p className="text-2xl font-bold">{transactions?.length || 0}</p>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold">
            {(transactions || []).filter((t: any) => t.status === "pending").length}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-bold">
            {(transactions || []).filter((t: any) => t.status === "completed").length}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {rows.length === 0 && (
          <div className="bg-white border rounded-2xl p-8 text-center text-gray-500">
            No transactions found.
          </div>
        )}

        {rows.map((tx: any) => {
          const listing = listingMap.get(tx.listing_id) as any;
          const buyer = userMap.get(tx.buyer_id) as any;
          const seller = userMap.get(tx.seller_id) as any;
          const book = listing?.book_id
            ? (bookMap.get(listing.book_id) as any)
            : null;

          const status = tx.status || "pending";

          return (
            <div key={tx.id} className="bg-white border rounded-2xl p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard size={20} className="text-gray-500" />
                    <h2 className="text-lg font-bold text-gray-900">
                      Transaction #{String(tx.id).slice(0, 8)}
                    </h2>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    Created: {date(tx.created_at)} · Type:{" "}
                    <span className="font-medium">{text(tx.transaction_type)}</span>
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit px-3 py-1 rounded-full text-sm font-semibold ${statusClass(
                    status
                  )}`}
                >
                  {text(status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <User size={16} />
                    Buyer
                  </div>
                  <p className="font-semibold text-gray-900">{userName(buyer)}</p>
                  <p className="text-sm text-gray-600">{text(buyer?.email)}</p>
                </div>

                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <User size={16} />
                    Seller
                  </div>
                  <p className="font-semibold text-gray-900">{userName(seller)}</p>
                  <p className="text-sm text-gray-600">{text(seller?.email)}</p>
                </div>

                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <BookOpen size={16} />
                    Listing / Book
                  </div>
                  <p className="font-semibold text-gray-900">
                    {text(listing?.title || listing?.book_title || book?.title)}
                  </p>
                  <p className="text-sm text-gray-600">
                    ISBN: {text(book?.isbn || listing?.isbn)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <DollarSign size={16} />
                    Amount
                  </div>
                  <p className="font-bold mt-1">{money(tx.amount)}</p>
                </div>

                <div className="border rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Platform Fee</p>
                  <p className="font-bold mt-1">{money(tx.platform_fee)}</p>
                </div>

                <div className="border rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Deposit</p>
                  <p className="font-bold mt-1">{money(tx.deposit_amount)}</p>
                </div>

                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <Calendar size={16} />
                    Rental Dates
                  </div>
                  <p className="font-bold mt-1">
                    {date(tx.rental_start_date)} → {date(tx.rental_end_date)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Meeting Confirmed</p>
                  <p className="font-medium">{date(tx.meeting_confirmed_at)}</p>
                </div>

                <div>
                  <p className="text-gray-500">Book Received</p>
                  <p className="font-medium">{date(tx.book_received_at)}</p>
                </div>

                <div>
                  <p className="text-gray-500">Completed</p>
                  <p className="font-medium">{date(tx.completed_at)}</p>
                </div>
              </div>

              <details className="border rounded-xl p-4 bg-gray-50">
                <summary className="cursor-pointer font-semibold text-sm text-gray-800 flex items-center gap-2">
                  <Info size={16} />
                  Admin / Stripe Details
                </summary>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
                  <div>
                    <p className="text-gray-500">Transaction ID</p>
                    <p className="font-mono break-all">{text(tx.id)}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Listing ID</p>
                    <p className="font-mono break-all">{text(tx.listing_id)}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Buyer ID</p>
                    <p className="font-mono break-all">{text(tx.buyer_id)}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Seller ID</p>
                    <p className="font-mono break-all">{text(tx.seller_id)}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Stripe Payment Intent</p>
                    <p className="font-mono break-all">
                      {text(tx.stripe_payment_intent_id)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Stripe Deposit Payment Intent</p>
                    <p className="font-mono break-all">
                      {text(tx.stripe_deposit_payment_intent_id)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Stripe Transfer ID</p>
                    <p className="font-mono break-all">
                      {text(tx.stripe_transfer_id)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Return Condition</p>
                    <p>{text(tx.return_condition)}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Actual Return Date</p>
                    <p>{datetime(tx.actual_return_date)}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Updated At</p>
                    <p>{datetime(tx.updated_at)}</p>
                  </div>
                </div>
              </details>

              <form action={updateTransactionStatus} className="flex flex-col md:flex-row gap-3 pt-2 border-t">
                <input type="hidden" name="transaction_id" value={tx.id} />

                <select
                  name="status"
                  defaultValue={status}
                  className="px-4 py-2.5 border rounded-xl text-sm"
                >
                  <option value="pending">Pending</option>
<option value="active">Active</option>
<option value="exchange_pending">Exchange Pending</option>
<option value="meeting_confirmed">Meeting Confirmed</option>
<option value="book_received">Book Received</option>
<option value="completed">Completed</option>
<option value="return_pending">Return Pending</option>
<option value="disputed">Disputed</option>
<option value="cancelled">Cancelled</option>
<option value="refunded">Refunded</option>
<option value="deposit_refunded">Deposit Refunded</option>
<option value="deposit_captured">Deposit Captured</option>
                </select>

                <button className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700">
                  Update Status
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
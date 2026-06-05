import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";
import { createClient } from "@supabase/supabase-js";
import {
  Search,
  Star,
  User,
  Lock,
  Unlock,
  Calendar,
  MessageSquare,
  Hash,
} from "lucide-react";
import { updateReviewLockStatus } from "./actions";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

  return fullName || user.email || "—";
}

function rating(value: any) {
  if (value === null || value === undefined) return "—";
  return `${value}/5`;
}

function lockClass(isLocked: boolean) {
  return isLocked
    ? "bg-red-100 text-red-800"
    : "bg-green-100 text-green-800";
}

export default async function AdminReviewsPage(props: any) {
  const searchParams = await Promise.resolve(props.searchParams || {});
  const q = String(searchParams.q || "").trim().toLowerCase();
  const lockFilter = String(searchParams.lock || "");
  const updated = String(searchParams.updated || "");
  const errorMessage = String(searchParams.error || "");

  let query = supabaseAdmin
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (lockFilter === "locked") {
    query = query.eq("is_locked", true);
  }

  if (lockFilter === "unlocked") {
    query = query.eq("is_locked", false);
  }

  const { data: reviews, error } = await query;

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Reviews Error</h1>
        <p className="mt-3 text-sm text-gray-700">{error.message}</p>
      </div>
    );
  }

  const userIds = [
    ...new Set(
      (reviews || [])
        .flatMap((review) => [review.reviewer_id, review.reviewee_id])
        .filter(Boolean)
    ),
  ];

  const transactionIds = [
    ...new Set((reviews || []).map((review) => review.transaction_id).filter(Boolean)),
  ];

  const { data: users } =
    userIds.length > 0
      ? await supabaseAdmin.from("users").select("*").in("id", userIds)
      : { data: [] };

  const { data: transactions } =
    transactionIds.length > 0
      ? await supabaseAdmin
          .from("transactions")
          .select("*")
          .in("id", transactionIds)
      : { data: [] };

  const usersById = new Map((users || []).map((user) => [user.id, user]));
  const transactionsById = new Map(
    (transactions || []).map((transaction) => [transaction.id, transaction])
  );

  const filteredReviews = (reviews || []).filter((review) => {
    if (!q) return true;

    const reviewer = usersById.get(review.reviewer_id);
    const reviewee = usersById.get(review.reviewee_id);
    const transaction = transactionsById.get(review.transaction_id);

    const searchable = [
      review.id,
      review.transaction_id,
      review.reviewer_id,
      review.reviewee_id,
      review.written_review,
      userName(reviewer),
      reviewer?.email,
      userName(reviewee),
      reviewee?.email,
      transaction?.status,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });

  return (
    <div className="p-8 space-y-8">
      <AdminPageHeader
  section="REVIEWS"
  title="Reviews"
  description="Manage buyer and seller reviews across the marketplace."
/>
      {updated && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Review successfully {updated}.
        </div>
      )}

      {errorMessage && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {decodeURIComponent(errorMessage)}
        </div>
      )}

      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              name="q"
              defaultValue={q}
              placeholder="Search review, transaction, user, email, or text..."
              className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <select
            name="lock"
            defaultValue={lockFilter}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-900"
          >
            <option value="">All Reviews</option>
            <option value="locked">Locked Only</option>
            <option value="unlocked">Unlocked Only</option>
          </select>

          <button
            type="submit"
            className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
          >
            Search
          </button>
        </form>
      </div>

      <div className="grid gap-4">
        {filteredReviews.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-500">
            No reviews found.
          </div>
        ) : (
          filteredReviews.map((review) => {
            const reviewer = usersById.get(review.reviewer_id);
            const reviewee = usersById.get(review.reviewee_id);
            const transaction = transactionsById.get(review.transaction_id);

            return (
              <div
                key={review.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">
                        Review
                      </h2>

                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${lockClass(
                          review.is_locked
                        )}`}
                      >
                        {review.is_locked ? (
                          <Lock size={13} />
                        ) : (
                          <Unlock size={13} />
                        )}
                        {review.is_locked ? "Locked" : "Unlocked"}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      ID: {review.id}
                    </p>
                  </div>

                  <form action={updateReviewLockStatus}>
                    <input type="hidden" name="review_id" value={review.id} />
                    <input
                      type="hidden"
                      name="is_locked"
                      value={review.is_locked ? "false" : "true"}
                    />

                    <button
                      type="submit"
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        review.is_locked
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-red-600 text-white hover:bg-red-700"
                      }`}
                    >
                      {review.is_locked ? (
                        <>
                          <Unlock size={15} />
                          Unlock Review
                        </>
                      ) : (
                        <>
                          <Lock size={15} />
                          Lock Review
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Star size={14} />
                      Overall
                    </div>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {rating(review.overall_rating)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Star size={14} />
                      Communication
                    </div>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {rating(review.communication_rating)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Star size={14} />
                      Reliability
                    </div>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {rating(review.reliability_rating)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Star size={14} />
                      Accuracy
                    </div>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {rating(review.accuracy_rating)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <User size={14} />
                      Reviewer
                    </div>
                    <p className="mt-2 font-semibold text-gray-900">
                      {userName(reviewer)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {text(reviewer?.email)}
                    </p>
                    <p className="mt-2 break-all text-xs text-gray-400">
                      ID: {review.reviewer_id}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <User size={14} />
                      Reviewee
                    </div>
                    <p className="mt-2 font-semibold text-gray-900">
                      {userName(reviewee)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {text(reviewee?.email)}
                    </p>
                    <p className="mt-2 break-all text-xs text-gray-400">
                      ID: {review.reviewee_id}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                    <MessageSquare size={14} />
                    Written Review
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {text(review.written_review)}
                  </p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Hash size={14} />
                      Transaction
                    </div>
                    <p className="mt-2 break-all text-sm font-semibold text-gray-900">
                      {text(review.transaction_id)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Status: {text(transaction?.status)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Calendar size={14} />
                      Created
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {date(review.created_at)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {datetime(review.created_at)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Calendar size={14} />
                      Updated
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {date(review.updated_at)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {datetime(review.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
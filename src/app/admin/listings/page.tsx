import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";import { createClient } from "@supabase/supabase-js";
import {
  Search,
  BookOpen,
  User,
  GraduationCap,
  Building2,
  DollarSign,
  Calendar,
  Tag,
} from "lucide-react";
import { updateListingStatus } from "./actions";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function money(value: any) {
  if (value === null || value === undefined || value === "") return "—";
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
  return fullName || user.email || "—";
}

function professorName(professor: any) {
  if (!professor) return "—";
  const firstName = professor.first_name || "";
  const lastName = professor.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || "—";
}

function statusClass(status: string) {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-800";
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "inactive":
      return "bg-gray-100 text-gray-800";
    case "sold":
      return "bg-red-100 text-red-800";
    case "rented":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
}

function typeClass(type: string) {
  switch (type) {
    case "sale":
      return "bg-blue-100 text-blue-800";
    case "rent":
    case "rental":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default async function AdminListingsPage(props: any) {
  const searchParams = await Promise.resolve(props.searchParams || {});
  const q = String(searchParams.q || "").trim().toLowerCase();
  const statusFilter = String(searchParams.status || "");
  const updated = String(searchParams.updated || "");
  const errorMessage = String(searchParams.error || "");

  let query = supabaseAdmin
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: listings, error } = await query;

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Listings Error</h1>
        <p className="mt-3 text-sm text-gray-700">{error.message}</p>
      </div>
    );
  }

  const sellerIds = [
    ...new Set((listings || []).map((item) => item.seller_id).filter(Boolean)),
  ];

  const bookIds = [
    ...new Set((listings || []).map((item) => item.book_id).filter(Boolean)),
  ];

  const professorIds = [
    ...new Set((listings || []).map((item) => item.professor_id).filter(Boolean)),
  ];

  const courseIds = [
    ...new Set((listings || []).map((item) => item.course_id).filter(Boolean)),
  ];

  const universityIds = [
    ...new Set((listings || []).map((item) => item.university_id).filter(Boolean)),
  ];

  const { data: users } =
    sellerIds.length > 0
      ? await supabaseAdmin.from("users").select("*").in("id", sellerIds)
      : { data: [] };

  const { data: books } =
    bookIds.length > 0
      ? await supabaseAdmin.from("books").select("*").in("id", bookIds)
      : { data: [] };

  const { data: professors } =
    professorIds.length > 0
      ? await supabaseAdmin.from("professors").select("*").in("id", professorIds)
      : { data: [] };

  const { data: courses } =
    courseIds.length > 0
      ? await supabaseAdmin.from("courses").select("*").in("id", courseIds)
      : { data: [] };

  const { data: universities } =
    universityIds.length > 0
      ? await supabaseAdmin.from("universities").select("*").in("id", universityIds)
      : { data: [] };

  const usersById = new Map((users || []).map((user) => [user.id, user]));
  const booksById = new Map((books || []).map((book) => [book.id, book]));
  const professorsById = new Map(
    (professors || []).map((professor) => [professor.id, professor])
  );
  const coursesById = new Map((courses || []).map((course) => [course.id, course]));
  const universitiesById = new Map(
    (universities || []).map((university) => [university.id, university])
  );

  const filteredListings = (listings || []).filter((listing) => {
    if (!q) return true;

    const seller = usersById.get(listing.seller_id);
    const book = booksById.get(listing.book_id);
    const professor = professorsById.get(listing.professor_id);
    const course = coursesById.get(listing.course_id);
    const university = universitiesById.get(listing.university_id);

    const searchable = [
      listing.id,
      listing.status,
      listing.listing_type,
      listing.condition,
      listing.description,
      userName(seller),
      seller?.email,
      book?.title,
      professorName(professor),
      course?.name,
      course?.code,
      university?.name,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchable.includes(q);
  });

  return (
    <div className="p-8 space-y-8">
      <AdminPageHeader
  section="LISTINGS"
  title="Listings"
  description="Manage marketplace listings, sellers, books, academic links, pricing, and listing status."
/>

      {updated && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Listing status successfully updated to {updated}.
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
              placeholder="Search listing, book, seller, professor, course, university..."
              className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-gray-900"
            />
          </div>

          <select
            name="status"
            defaultValue={statusFilter}
            className="rounded-xl border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-900"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
            <option value="sold">Sold</option>
            <option value="rented">Rented</option>
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
        {filteredListings.length === 0 ? (
          <div className="rounded-2xl border bg-white p-8 text-center text-sm text-gray-500">
            No listings found.
          </div>
        ) : (
          filteredListings.map((listing) => {
            const seller = usersById.get(listing.seller_id);
            const book = booksById.get(listing.book_id);
            const professor = professorsById.get(listing.professor_id);
            const course = coursesById.get(listing.course_id);
            const university = universitiesById.get(listing.university_id);

            return (
              <div
                key={listing.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-gray-900">
                        {text(book?.title)}
                      </h2>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          listing.status
                        )}`}
                      >
                        {text(listing.status)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${typeClass(
                          listing.listing_type
                        )}`}
                      >
                        {text(listing.listing_type)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      Listing ID: {listing.id}
                    </p>
                  </div>

                  <form action={updateListingStatus}>
                    <input type="hidden" name="listing_id" value={listing.id} />

                    <div className="flex gap-2">
                      <select
                        name="status"
                        defaultValue={listing.status}
                        className="rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
                      >
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="inactive">Inactive</option>
                        <option value="sold">Sold</option>
                        <option value="rented">Rented</option>
                      </select>

                      <button
                        type="submit"
                        className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
                      >
                        Update
                      </button>
                    </div>
                  </form>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <DollarSign size={14} />
                      Price
                    </div>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {money(listing.price)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Suggested: {money(listing.suggested_price)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <DollarSign size={14} />
                      Deposit
                    </div>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {money(listing.deposit_amount)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Rental days: {text(listing.rental_duration_days)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Tag size={14} />
                      Condition
                    </div>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {text(listing.condition)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Calendar size={14} />
                      Created
                    </div>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {date(listing.created_at)}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {datetime(listing.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <User size={14} />
                      Seller
                    </div>
                    <p className="mt-2 font-semibold text-gray-900">
                      {userName(seller)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      {text(seller?.email)}
                    </p>
                    <p className="mt-2 break-all text-xs text-gray-400">
                      ID: {listing.seller_id}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <BookOpen size={14} />
                      Book
                    </div>
                    <p className="mt-2 font-semibold text-gray-900">
                      {text(book?.title)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Author: {text(book?.author)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      ISBN: {text(book?.isbn || book?.ISBN)}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <GraduationCap size={14} />
                      Academic Context
                    </div>
                    <p className="mt-2 text-sm text-gray-700">
                      Professor:{" "}
                      <span className="font-semibold text-gray-900">
                        {professorName(professor)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      Course:{" "}
                      <span className="font-semibold text-gray-900">
                        {text(course?.name)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Code: {text(course?.code)}
                    </p>
                  </div>

                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-500">
                      <Building2 size={14} />
                      University
                    </div>
                    <p className="mt-2 font-semibold text-gray-900">
                      {text(university?.name)}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      State: {text(university?.state)}
                    </p>
                    <p className="mt-2 break-all text-xs text-gray-400">
                      ID: {listing.university_id}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-xl border p-4">
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    Description
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                    {text(listing.description)}
                  </p>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Rental End Date
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {date(listing.rental_end_date)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase text-gray-500">
                      Updated
                    </p>
                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {datetime(listing.updated_at)}
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
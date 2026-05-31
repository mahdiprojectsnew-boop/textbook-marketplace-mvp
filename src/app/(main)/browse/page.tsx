import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import Link from "next/link";
import { BookOpen, Tag, RefreshCw, Building2, GraduationCap } from "lucide-react";
import { getFirstImageUrl } from "@/lib/supabase/images";
import { SearchBar }     from "@/components/browse/SearchBar";
import { FilterBar }     from "@/components/browse/FilterBar";
import { ActiveFilters } from "@/components/browse/ActiveFilters";

// ─── Types ────────────────────────────────────────────────────
interface SearchParams {
  q?:        string;
  type?:     string;
  cond?:     string;
  uni?:      string;
  prof?:     string;
  course?:   string;
  minPrice?: string;
  maxPrice?: string;
  sort?:     string;
}

interface ListingRow {
  id: string;
  listing_type: "sale" | "rental";
  condition: string;
  price: number;
  deposit_amount: number | null;
  rental_duration_days: number | null;
  books: { title: string; author: string | null; isbn: string | null } | null;
  universities: { id: string; name: string; state: string | null } | null;
  professors: { id: string; first_name: string; last_name: string } | null;
  courses: { id: string; name: string; code: string | null } | null;
  listing_images: { image_url: string; sort_order: number }[];
}

const CONDITION_LABELS: Record<string, string> = {
  like_new: "Like New", very_good: "Very Good",
  good: "Good", fair: "Fair", poor: "Poor",
};

const CONDITION_COLORS: Record<string, string> = {
  like_new: "bg-emerald-50 text-emerald-700",
  very_good: "bg-green-50 text-green-700",
  good: "bg-blue-50 text-blue-700",
  fair: "bg-amber-50 text-amber-700",
  poor: "bg-red-50 text-red-700",
};

// ─── Listing card ─────────────────────────────────────────────
function ListingCard({ listing }: { listing: ListingRow }) {
  const book       = listing.books;
  const imgUrl     = getFirstImageUrl(listing.listing_images);
  const condColor  = CONDITION_COLORS[listing.condition] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] hover:border-[#93c5fd] hover:shadow-md transition-all flex flex-col">
      {/* Image */}
      <div className="h-36 rounded-t-xl overflow-hidden bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] relative flex items-center justify-center">
        {imgUrl
          ? <img src={imgUrl} alt={book?.title ?? ""} className="w-full h-full object-cover" />
          : <BookOpen size={32} className="text-[#cbd5e1]" strokeWidth={1.5} />
        }
        <span className={`absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
          listing.listing_type === "sale" ? "bg-[#eff6ff] text-[#1d4ed8]" : "bg-purple-50 text-purple-700"
        }`}>
          {listing.listing_type === "sale" ? <Tag size={8} /> : <RefreshCw size={8} />}
          {listing.listing_type === "sale" ? "Sale" : "Rent"}
        </span>
      </div>

      {/* Body */}
      <div className="p-3.5 flex flex-col flex-1 gap-2.5">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0f172a] leading-snug line-clamp-2">
            {book?.title ?? "Untitled"}
          </p>
          {book?.author && (
            <p className="text-xs text-[#64748b] mt-0.5 truncate">{book.author}</p>
          )}
        </div>

        <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-full ${condColor}`}>
          {CONDITION_LABELS[listing.condition] ?? listing.condition}
        </span>

        {/* Academic context */}
        {(listing.universities || listing.professors || listing.courses) && (
          <div className="space-y-0.5">
            {listing.universities && (
              <p className="flex items-center gap-1.5 text-[11px] text-[#64748b] truncate">
                <Building2 size={10} className="text-[#94a3b8] shrink-0" />
                {listing.universities.name}
              </p>
            )}
            {(listing.professors || listing.courses) && (
              <p className="flex items-center gap-1.5 text-[11px] text-[#64748b] truncate">
                <GraduationCap size={10} className="text-[#94a3b8] shrink-0" />
                {listing.professors
                  ? `${listing.professors.last_name}, ${listing.professors.first_name}`
                  : ""}
                {listing.professors && listing.courses ? " · " : ""}
                {listing.courses ? (listing.courses.code ?? listing.courses.name) : ""}
              </p>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-end justify-between pt-1.5 border-t border-[#f1f5f9]">
          <div>
            <p className="text-base font-bold text-[#0f172a]">${listing.price.toFixed(2)}</p>
            {listing.listing_type === "rental" && listing.deposit_amount && (
              <p className="text-[10px] text-[#94a3b8]">+${listing.deposit_amount.toFixed(2)} deposit</p>
            )}
          </div>
          <Link href={`/listings/${listing.id}`}
            className="px-2.5 py-1.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold rounded-lg transition">
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp      = await searchParams;
  const supabase = await createClient();

  const q        = sp.q?.trim()       ?? "";
  const typeF    = sp.type            ?? "";
  const condF    = sp.cond            ?? "";
  const uniF     = sp.uni             ?? "";
  const profF    = sp.prof            ?? "";
  const courseF  = sp.course          ?? "";
  const minP     = sp.minPrice        ?? "";
  const maxP     = sp.maxPrice        ?? "";
  const sort     = sp.sort            ?? "newest";

  // ── Fetch filter options in parallel ───────────────────────
  const [uniRes, profRes, courseRes] = await Promise.all([
    supabase.from("universities").select("id, name, state").eq("is_active", true).order("name").limit(200),
    supabase.from("professors").select("id, first_name, last_name")
      .eq("is_active", true)
      .eq(uniF ? "university_id" : "is_active", uniF || true)
      .order("last_name").limit(200),
    supabase.from("courses").select("id, name, code")
      .eq("is_active", true)
      .eq(uniF ? "university_id" : "is_active", uniF || true)
      .order("name").limit(200),
  ]);

  const universities = uniRes.data ?? [];
  const professors   = profRes.data ?? [];
  const courses      = courseRes.data ?? [];

  // ── Build listings query ─────────────────────────────────
  let query = supabase
    .from("listings")
    .select(`
      id, listing_type, condition, price, deposit_amount, rental_duration_days,
      books ( title, author, isbn ),
      universities ( id, name, state ),
      professors ( id, first_name, last_name ),
      courses ( id, name, code )
    `)
    .eq("status", "active");

  if (typeF)   query = query.eq("listing_type",  typeF);
  if (condF)   query = query.eq("condition",     condF);
  if (uniF)    query = query.eq("university_id", uniF);
  if (profF)   query = query.eq("professor_id",  profF);
  if (courseF) query = query.eq("course_id",     courseF);
  if (minP)    query = query.gte("price", parseFloat(minP));
  if (maxP)    query = query.lte("price", parseFloat(maxP));

  // Sort
  if (sort === "price_asc")       query = query.order("price", { ascending: true });
  else if (sort === "price_desc") query = query.order("price", { ascending: false });
  else                            query = query.order("created_at", { ascending: false });

  query = query.limit(60);

  const { data: rawListings } = await query;
  let listings = (rawListings ?? []) as unknown as Omit<ListingRow, "listing_images">[];

  // ── Client-side text search on title/author/isbn/professor/course ──
  if (q) {
    const ql = q.toLowerCase();
    listings = listings.filter(l =>
      l.books?.title?.toLowerCase().includes(ql) ||
      l.books?.author?.toLowerCase().includes(ql) ||
      l.books?.isbn?.toLowerCase().includes(ql) ||
      l.universities?.name?.toLowerCase().includes(ql) ||
      l.professors?.last_name?.toLowerCase().includes(ql) ||
      l.professors?.first_name?.toLowerCase().includes(ql) ||
      l.courses?.name?.toLowerCase().includes(ql) ||
      l.courses?.code?.toLowerCase().includes(ql)
    );
  }

  // ── Fetch listing images separately (avoid RLS join issue) ──
  let mergedListings: ListingRow[] = [];
  if (listings.length > 0) {
    const ids = listings.map(l => l.id);
    const { data: imgData } = await supabase
      .from("listing_images")
      .select("listing_id, image_url, sort_order")
      .in("listing_id", ids);

    const imgMap: Record<string, { image_url: string; sort_order: number }[]> = {};
    for (const img of imgData ?? []) {
      if (!imgMap[img.listing_id]) imgMap[img.listing_id] = [];
      imgMap[img.listing_id].push(img);
    }
    mergedListings = listings.map(l => ({ ...l, listing_images: imgMap[l.id] ?? [] }));
  }

  // ── Labels for active filter pills ──────────────────────────
  const uniLabel  = universities.find(u => u.id === uniF)?.name;
  const profObj   = professors.find(p => p.id === profF);
  const profLabel = profObj ? `${profObj.last_name}, ${profObj.first_name}` : undefined;
  const courseObj = courses.find(c => c.id === courseF);
  const courseLabel = courseObj ? (courseObj.code ?? courseObj.name) : undefined;

  const hasFilters = !!(q || typeF || condF || uniF || profF || courseF || minP || maxP);
  const current = { type: typeF, cond: condF, uni: uniF, prof: profF, course: courseF, minPrice: minP, maxPrice: maxP, sort };

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-5 py-7 space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">Browse Textbooks</h1>
            <p className="text-sm text-[#64748b] mt-0.5">
              {mergedListings.length > 0
                ? `${mergedListings.length} listing${mergedListings.length !== 1 ? "s" : ""}${hasFilters ? " matching your search" : ""}`
                : hasFilters ? "No listings match your search" : "No listings yet"}
            </p>
          </div>
          <Link href="/listings/new"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
            + List a Book
          </Link>
        </div>

        {/* Search bar */}
        <Suspense>
          <SearchBar defaultValue={q} />
        </Suspense>

        {/* Filter bar */}
        <Suspense>
          <FilterBar
            universities={universities}
            professors={professors}
            courses={courses}
            current={current}
          />
        </Suspense>

        {/* Active filter pills */}
        <Suspense>
          <ActiveFilters
            current={{ q, type: typeF, cond: condF, uni: uniF, prof: profF, course: courseF, minPrice: minP, maxPrice: maxP }}
            labels={{ uni: uniLabel, prof: profLabel, course: courseLabel }}
          />
        </Suspense>

        {/* Results grid */}
        {mergedListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f1f5f9] flex items-center justify-center">
              <BookOpen size={28} className="text-[#94a3b8]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-bold text-[#374151]">
                {hasFilters ? "No listings match your search" : "No listings yet"}
              </p>
              <p className="text-sm text-[#94a3b8] mt-1">
                {hasFilters ? "Try adjusting your filters or search terms." : "Be the first to list a textbook!"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {hasFilters && (
                <Link href="/browse"
                  className="px-4 py-2 text-sm font-semibold text-[#1d4ed8] border border-[#bfdbfe] bg-[#eff6ff] rounded-xl hover:bg-[#dbeafe] transition">
                  Clear all filters
                </Link>
              )}
              <Link href="/listings/new"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#1d4ed8] rounded-xl hover:bg-[#1e40af] transition">
                List a textbook
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {mergedListings.map(l => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}

      </div>
    </div>
  );
}

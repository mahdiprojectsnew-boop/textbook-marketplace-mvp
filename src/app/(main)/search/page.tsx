"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getFirstImageUrl } from "@/lib/supabase/images";
import {
  BookOpen, Search, SlidersHorizontal, X, Tag, RefreshCw,
  Building2, GraduationCap, ChevronDown, Loader2, ArrowUpDown
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface ListingRow {
  id: string;
  listing_type: "sale" | "rental";
  condition: string;
  price: number;
  deposit_amount: number | null;
  rental_duration_days: number | null;
  status: string;
  created_at: string;
  books: {
    title: string;
    author: string | null;
    isbn: string | null;
    cover_image_url: string | null;
  } | null;
  universities: { name: string; state: string | null } | null;
  professors: { first_name: string; last_name: string } | null;
  courses: { name: string; code: string | null } | null;
  users: { first_name: string | null; last_name: string | null; is_academic_verified: boolean } | null;
  listing_images: { image_url: string; sort_order: number }[];
}

interface University { id: string; name: string; state: string | null; }

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

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "Newest first" },
  { value: "price_asc",       label: "Price: low to high" },
  { value: "price_desc",      label: "Price: high to low" },
];

// ─── Helpers ─────────────────────────────────────────────────
function Badge({ type }: { type: "sale" | "rental" }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
      type === "sale" ? "bg-[#eff6ff] text-[#1d4ed8]" : "bg-purple-50 text-purple-700"
    }`}>
      {type === "sale" ? <Tag size={9} /> : <RefreshCw size={9} />}
      {type === "sale" ? "For Sale" : "For Rent"}
    </span>
  );
}

function ConditionPill({ condition }: { condition: string }) {
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CONDITION_COLORS[condition] ?? "bg-gray-100 text-gray-600"}`}>
      {CONDITION_LABELS[condition] ?? condition}
    </span>
  );
}

function BookCard({ listing }: { listing: ListingRow }) {
  const book = listing.books;
  const uni  = listing.universities;
  const prof = listing.professors;
  const course = listing.courses;

  // First real uploaded image, resolved to a displayable URL
  const firstImageUrl = getFirstImageUrl(listing.listing_images ?? []);

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] hover:border-[#93c5fd] hover:shadow-md transition-all flex flex-col">
      {/* Image area */}
      <div className="h-36 bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0] rounded-t-xl flex items-center justify-center relative overflow-hidden">
        {firstImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={firstImageUrl} alt={book?.title ?? "Book"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-[#94a3b8]">
            <BookOpen size={32} strokeWidth={1.5} />
            <span className="text-[10px] font-medium uppercase tracking-wide">No photo</span>
          </div>
        )}
        {/* Badge top-left */}
        <div className="absolute top-2 left-2">
          <Badge type={listing.listing_type} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Title + author */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#0f172a] leading-snug line-clamp-2">
            {book?.title ?? "Untitled"}
          </h3>
          {book?.author && (
            <p className="text-xs text-[#64748b] mt-0.5 truncate">{book.author}</p>
          )}
        </div>

        {/* Condition pill */}
        <ConditionPill condition={listing.condition} />

        {/* Academic context */}
        {(uni || prof || course) && (
          <div className="space-y-1">
            {uni && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                <Building2 size={11} className="shrink-0 text-[#94a3b8]" />
                <span className="truncate">{uni.name}{uni.state ? `, ${uni.state}` : ""}</span>
              </div>
            )}
            {(prof || course) && (
              <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                <GraduationCap size={11} className="shrink-0 text-[#94a3b8]" />
                <span className="truncate">
                  {prof ? `${prof.last_name}, ${prof.first_name}` : ""}
                  {prof && course ? " · " : ""}
                  {course ? (course.code ?? course.name) : ""}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Price row */}
        <div className="flex items-end justify-between pt-1 border-t border-[#f1f5f9]">
          <div>
            <p className="text-lg font-bold text-[#0f172a]">
              ${listing.price.toFixed(2)}
            </p>
            {listing.listing_type === "rental" && (
              <p className="text-[10px] text-[#94a3b8]">
                {listing.rental_duration_days ? `${listing.rental_duration_days} days` : ""}
                {listing.deposit_amount ? ` · $${listing.deposit_amount.toFixed(2)} deposit` : ""}
              </p>
            )}
          </div>
          <Link
            href={`/listings/${listing.id}`}
            className="px-3 py-1.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-xs font-semibold rounded-lg transition"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}

function SelectFilter({
  value, onChange, children, placeholder,
}: {
  value: string; onChange: (v: string) => void;
  children: React.ReactNode; placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none w-full pl-3 pr-8 py-2 text-sm border border-[#d1d5db] rounded-lg bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────
export default function BrowsePage() {
  const supabase = createClient();

  const [listings,      setListings]      = useState<ListingRow[]>([]);
  const [universities,  setUniversities]  = useState<University[]>([]);
  const [loading,       setLoading]       = useState(true);

  // Filters
  const [query,         setQuery]         = useState("");
  const [typeFilter,    setTypeFilter]    = useState("");
  const [condFilter,    setCondFilter]    = useState("");
  const [uniFilter,     setUniFilter]     = useState("");
  const [sortBy,        setSortBy]        = useState("created_at_desc");
  const [showFilters,   setShowFilters]   = useState(false);

  // Active filter count for badge
  const activeFilters = [typeFilter, condFilter, uniFilter].filter(Boolean).length;

  // ── Fetch universities for filter dropdown ──
  useEffect(() => {
    supabase.from("universities").select("id, name, state")
      .eq("is_active", true).order("name")
      .then(({ data }) => setUniversities(data ?? []));
  }, []);

  // ── Fetch listings ──────────────────────────────────────────
  const fetchListings = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("listings")
      .select(`
        id, listing_type, condition, price, deposit_amount,
        rental_duration_days, status, created_at,
        books ( title, author, isbn, cover_image_url ),
        universities ( name, state ),
        professors ( first_name, last_name ),
        courses ( name, code ),
        users ( first_name, last_name, is_academic_verified )
      `)
      .eq("status", "active");

    if (typeFilter) q = q.eq("listing_type", typeFilter);
    if (condFilter) q = q.eq("condition",     condFilter);
    if (uniFilter)  q = q.eq("university_id", uniFilter);

    // Sort
    if (sortBy === "price_asc")        q = q.order("price", { ascending: true });
    else if (sortBy === "price_desc")  q = q.order("price", { ascending: false });
    else                               q = q.order("created_at", { ascending: false });

    q = q.limit(60);

    const { data, error } = await q;
    if (error) console.error("Listings fetch error:", error);

    const rows = (data as unknown as ListingRow[]) ?? [];

    // Fetch listing_images separately to avoid RLS join issues
    if (rows.length > 0) {
      const ids = rows.map(r => r.id);
      const { data: imgData } = await supabase
        .from("listing_images")
        .select("listing_id, image_url, sort_order")
        .in("listing_id", ids);

      // Group images by listing_id
      const imgMap: Record<string, { image_url: string; sort_order: number }[]> = {};
      for (const img of imgData ?? []) {
        if (!imgMap[img.listing_id]) imgMap[img.listing_id] = [];
        imgMap[img.listing_id].push({ image_url: img.image_url, sort_order: img.sort_order });
      }

      // Merge into listing rows
      const merged = rows.map(r => ({
        ...r,
        listing_images: imgMap[r.id] ?? [],
      }));
      setListings(merged);
    } else {
      setListings(rows);
    }

    setLoading(false);
  }, [typeFilter, condFilter, uniFilter, sortBy]);

  useEffect(() => { fetchListings(); }, [fetchListings]);

  // ── Client-side text search ─────────────────────────────────
  const filtered = listings.filter(l => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    const b = l.books;
    return (
      b?.title?.toLowerCase().includes(q) ||
      b?.author?.toLowerCase().includes(q) ||
      b?.isbn?.toLowerCase().includes(q) ||
      l.universities?.name?.toLowerCase().includes(q) ||
      l.professors?.last_name?.toLowerCase().includes(q) ||
      l.courses?.name?.toLowerCase().includes(q) ||
      l.courses?.code?.toLowerCase().includes(q)
    );
  });

  function clearFilters() {
    setTypeFilter(""); setCondFilter(""); setUniFilter("");
    setQuery(""); setSortBy("created_at_desc");
  }

  // ─── Render ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* Header */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
                <BookOpen size={14} className="text-white" />
              </div>
              <span className="font-bold text-[#0f172a] text-sm hidden sm:block">Textbook Marketplace</span>
            </Link>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/browse"   className="px-3 py-1.5 rounded-lg font-semibold text-[#1d4ed8] bg-[#eff6ff]">Browse</Link>
            <Link href="/listings/new" className="px-3 py-1.5 rounded-lg font-medium text-[#64748b] hover:bg-[#f1f5f9] transition hidden sm:block">+ List a Book</Link>
            <Link href="/dashboard"    className="px-3 py-1.5 rounded-lg font-medium text-[#64748b] hover:bg-[#f1f5f9] transition">Dashboard</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 py-7">

        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#0f172a]">Browse Textbooks</h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            {loading ? "Loading listings…" : `${filtered.length} listing${filtered.length !== 1 ? "s" : ""} available`}
          </p>
        </div>

        {/* Search + filter bar */}
        <div className="mb-5 space-y-3">
          <div className="flex gap-2">
            {/* Search box */}
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by title, author, ISBN, professor, course…"
                className="w-full pl-9 pr-4 py-2 text-sm border border-[#d1d5db] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition"
              />
              {query && (
                <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition ${
                showFilters || activeFilters > 0
                  ? "border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]"
                  : "border-[#d1d5db] bg-white text-[#374151] hover:bg-[#f9fafb]"
              }`}
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilters > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#1d4ed8] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFilters}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative hidden sm:block">
              <ArrowUpDown size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="appearance-none pl-8 pr-7 py-2 text-sm border border-[#d1d5db] rounded-lg bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] cursor-pointer transition"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
            </div>
          </div>

          {/* Filter row */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 items-center p-3 bg-white border border-[#e5e7eb] rounded-xl">
              <SelectFilter value={typeFilter} onChange={setTypeFilter} placeholder="All types">
                <option value="sale">For Sale</option>
                <option value="rental">For Rent</option>
              </SelectFilter>

              <SelectFilter value={condFilter} onChange={setCondFilter} placeholder="Any condition">
                <option value="like_new">Like New</option>
                <option value="very_good">Very Good</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </SelectFilter>

              <SelectFilter value={uniFilter} onChange={setUniFilter} placeholder="Any university">
                {universities.map(u => (
                  <option key={u.id} value={u.id}>{u.name}{u.state ? `, ${u.state}` : ""}</option>
                ))}
              </SelectFilter>

              {(activeFilters > 0 || query) && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <X size={12} /> Clear all
                </button>
              )}
            </div>
          )}

          {/* Active filter pills */}
          {(typeFilter || condFilter || uniFilter) && !showFilters && (
            <div className="flex flex-wrap gap-2">
              {typeFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff6ff] border border-[#bfdbfe] text-xs font-semibold text-[#1d4ed8]">
                  {typeFilter === "sale" ? "For Sale" : "For Rent"}
                  <button onClick={() => setTypeFilter("")}><X size={11} /></button>
                </span>
              )}
              {condFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff6ff] border border-[#bfdbfe] text-xs font-semibold text-[#1d4ed8]">
                  {CONDITION_LABELS[condFilter]}
                  <button onClick={() => setCondFilter("")}><X size={11} /></button>
                </span>
              )}
              {uniFilter && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff6ff] border border-[#bfdbfe] text-xs font-semibold text-[#1d4ed8]">
                  {universities.find(u => u.id === uniFilter)?.name ?? "University"}
                  <button onClick={() => setUniFilter("")}><X size={11} /></button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-[#94a3b8]">
            <Loader2 size={28} className="animate-spin" />
            <p className="text-sm">Loading listings…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#f1f5f9] flex items-center justify-center">
              <BookOpen size={28} className="text-[#94a3b8]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-base font-bold text-[#374151]">No listings found</p>
              <p className="text-sm text-[#94a3b8] mt-1">
                {query || activeFilters > 0
                  ? "Try adjusting your search or filters."
                  : "Be the first to list a textbook!"}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center">
              {(query || activeFilters > 0) && (
                <button onClick={clearFilters}
                  className="px-4 py-2 text-sm font-semibold text-[#1d4ed8] border border-[#bfdbfe] bg-[#eff6ff] rounded-lg hover:bg-[#dbeafe] transition">
                  Clear filters
                </button>
              )}
              <Link href="/listings/new"
                className="px-4 py-2 text-sm font-semibold text-white bg-[#1d4ed8] rounded-lg hover:bg-[#1e40af] transition">
                List a textbook
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filtered.map(l => <BookCard key={l.id} listing={l} />)}
          </div>
        )}
      </div>
    </div>
  );
}

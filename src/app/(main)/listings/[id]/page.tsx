import { createClient } from "@/lib/supabase/server";
import { resolveImageUrl, isRealImage } from "@/lib/supabase/images";
import { ContactSellerButton } from "./ContactSellerButton";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  BookOpen, ChevronLeft, Tag, RefreshCw, Building2,
  GraduationCap, User, CheckCircle2, Calendar, DollarSign,
  Hash, BookMarked, MessageCircle, Share2, Clock, Pencil, Archive
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────
interface ListingDetail {
  id: string;
  seller_id: string;
  listing_type: "sale" | "rental";
  condition: string;
  price: number;
  deposit_amount: number | null;
  rental_duration_days: number | null;
  rental_end_date: string | null;
  description: string | null;
  status: string;
  created_at: string;
  books: {
    title: string;
    author: string | null;
    isbn: string | null;
    edition: string | null;
    publisher: string | null;
    year: number | null;
    cover_image_url: string | null;
  } | null;
  universities: { name: string; state: string | null; website: string | null } | null;
  professors: { first_name: string; last_name: string } | null;
  courses: { name: string; code: string | null } | null;
  users: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    is_academic_verified: boolean;
    average_rating: number | null;
    total_reviews: number;
    created_at: string;
  } | null;
  listing_images: { id: string; image_url: string; image_type: string; sort_order: number }[];
}

const CONDITION_META: Record<string, { label: string; color: string; bg: string }> = {
  like_new:  { label: "Like New",   color: "text-emerald-700", bg: "bg-emerald-50" },
  very_good: { label: "Very Good",  color: "text-green-700",   bg: "bg-green-50"   },
  good:      { label: "Good",       color: "text-blue-700",    bg: "bg-blue-50"    },
  fair:      { label: "Fair",       color: "text-amber-700",   bg: "bg-amber-50"   },
  poor:      { label: "Poor",       color: "text-red-700",     bg: "bg-red-50"     },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7)  return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
  return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
}

// ─── Stat pill ────────────────────────────────────────────────
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 py-3 border-b border-[#f1f5f9] last:border-0">
      <div className="w-7 h-7 rounded-lg bg-[#f1f5f9] flex items-center justify-center text-[#64748b] shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-[#111827] truncate">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch auth + listing in parallel
  const [authResult, listingResult] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("listings")
      .select(`
        id, listing_type, condition, price, deposit_amount, seller_id,
        rental_duration_days, rental_end_date, description, status, created_at,
        books ( title, author, isbn, edition, publisher, year, cover_image_url ),
        universities ( name, state, website ),
        professors ( first_name, last_name ),
        courses ( name, code ),
        users ( id, first_name, last_name, is_academic_verified, average_rating, total_reviews, created_at ),
        listing_images ( id, image_url, image_type, sort_order )
      `)
      .eq("id", id)
      .single(),
  ]);

  const currentUser = authResult.data.user;
  const { data, error } = listingResult;

  // 1. No listing at all
  if (error || !data) notFound();

  const sellerId = (data as any).seller_id as string;
  const isOwnListing = currentUser?.id === sellerId;

  // 2. Inactive listing — only owner can view
  if ((data as any).status !== "active" && !isOwnListing) notFound();

  const listing = data as unknown as ListingDetail;
  const book    = listing.books;
  const seller  = listing.users;
  const cond    = CONDITION_META[listing.condition] ?? { label: listing.condition, color: "text-gray-700", bg: "bg-gray-100" };

  const images = [...(listing.listing_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(img => ({ ...img, resolved_url: resolveImageUrl(img.image_url) }))
    .filter(img => img.resolved_url !== null);

  const sellerName = seller?.first_name
    ? `${seller.first_name} ${seller.last_name ?? ""}`.trim()
    : "Anonymous";

  const sellerInitials = seller?.first_name
    ? `${seller.first_name[0]}${seller.last_name?.[0] ?? ""}`.toUpperCase()
    : "?";

  const platformFee = listing.price * 0.04;
  const buyerTotal  = listing.price + platformFee;

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* Header */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link href="/browse" className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition">
            <ChevronLeft size={18} />
          </Link>
          <div className="w-px h-5 bg-[#e5e7eb]" />
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] flex items-center justify-center shrink-0">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="text-sm font-semibold text-[#0f172a] truncate hidden sm:block">
              {book?.title ?? "Listing"}
            </span>
          </div>
          <div className="ml-auto">
            <button className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition">
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-5 py-7">
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">

          {/* ── LEFT COLUMN ─────────────────────────────────── */}
          <div className="space-y-5">

            {/* Inactive listing banner — only shown to owner */}
            {listing.status !== "active" && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <Archive size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">This listing is inactive</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    It is not visible to other users. Reactivate it from your dashboard to make it public again.
                  </p>
                </div>
                <a href="/dashboard"
                  className="text-xs font-bold text-amber-700 hover:underline shrink-0">
                  Dashboard →
                </a>
              </div>
            )}

            {/* Image gallery */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
              {images.length > 0 ? (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {images.map((img, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.id}
                      src={img.resolved_url!}
                      alt={`Book photo ${i + 1}`}
                      className={`rounded-lg object-cover shrink-0 ${
                        i === 0 ? "h-64 w-auto max-w-[320px]" : "h-20 w-20 cursor-pointer opacity-80 hover:opacity-100 transition"
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center gap-3 text-[#94a3b8] bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9]">
                  <BookOpen size={40} strokeWidth={1.5} />
                  <p className="text-sm font-medium">No photos uploaded</p>
                </div>
              )}
            </div>

            {/* Book info */}
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 space-y-4">
              {/* Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                  listing.listing_type === "sale" ? "bg-[#eff6ff] text-[#1d4ed8]" : "bg-purple-50 text-purple-700"
                }`}>
                  {listing.listing_type === "sale" ? <Tag size={10} /> : <RefreshCw size={10} />}
                  {listing.listing_type === "sale" ? "For Sale" : "For Rent"}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cond.bg} ${cond.color}`}>
                  {cond.label}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-[#94a3b8]">
                  <Clock size={10} />
                  Listed {timeAgo(listing.created_at)}
                </span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-2xl font-bold text-[#0f172a] leading-snug">
                  {book?.title ?? "Untitled"}
                </h1>
                {book?.author && (
                  <p className="text-[#64748b] mt-1">by {book.author}</p>
                )}
              </div>

              {/* Book metadata */}
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-[#64748b]">
                {book?.edition && (
                  <span className="flex items-center gap-1.5">
                    <BookMarked size={13} className="text-[#94a3b8]" />
                    {book.edition} Edition
                  </span>
                )}
                {book?.isbn && (
                  <span className="flex items-center gap-1.5">
                    <Hash size={13} className="text-[#94a3b8]" />
                    ISBN: {book.isbn}
                  </span>
                )}
                {book?.publisher && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-[#94a3b8]" />
                    {book.publisher}
                  </span>
                )}
                {book?.year && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-[#94a3b8]" />
                    {book.year}
                  </span>
                )}
              </div>

              {/* Description */}
              {listing.description && (
                <div className="pt-3 border-t border-[#f1f5f9]">
                  <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">Seller Notes</p>
                  <p className="text-sm text-[#374151] leading-relaxed whitespace-pre-line">
                    {listing.description}
                  </p>
                </div>
              )}
            </div>

            {/* Academic context */}
            {(listing.universities || listing.professors || listing.courses) && (
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
                <h2 className="text-sm font-bold text-[#0f172a] mb-3">Academic Context</h2>
                <div className="space-y-0">
                  {listing.universities && (
                    <Stat
                      icon={<Building2 size={14} />}
                      label="University"
                      value={`${listing.universities.name}${listing.universities.state ? `, ${listing.universities.state}` : ""}`}
                    />
                  )}
                  {listing.professors && (
                    <Stat
                      icon={<User size={14} />}
                      label="Professor"
                      value={`${listing.professors.last_name}, ${listing.professors.first_name}`}
                    />
                  )}
                  {listing.courses && (
                    <Stat
                      icon={<GraduationCap size={14} />}
                      label="Course"
                      value={`${listing.courses.code ? listing.courses.code + " — " : ""}${listing.courses.name}`}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN — sticky sidebar ───────────────── */}
          <div className="space-y-4">
            <div className="sticky top-20 space-y-4">

              {/* Price card */}
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 space-y-4">
                {/* Price */}
                <div>
                  <p className="text-3xl font-bold text-[#0f172a]">
                    ${listing.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    {listing.listing_type === "sale"
                      ? `+$${platformFee.toFixed(2)} platform fee — buyer pays $${buyerTotal.toFixed(2)}`
                      : "Rental fee charged at checkout"}
                  </p>
                </div>

                {/* Rental details */}
                {listing.listing_type === "rental" && (
                  <div className="space-y-2 py-3 border-y border-[#f1f5f9]">
                    {listing.deposit_amount && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#64748b] flex items-center gap-1.5">
                          <DollarSign size={13} /> Security deposit
                        </span>
                        <span className="font-semibold text-[#0f172a]">${listing.deposit_amount.toFixed(2)}</span>
                      </div>
                    )}
                    {listing.rental_duration_days && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#64748b] flex items-center gap-1.5">
                          <Calendar size={13} /> Duration
                        </span>
                        <span className="font-semibold text-[#0f172a]">{listing.rental_duration_days} days</span>
                      </div>
                    )}
                    {listing.deposit_amount && (
                      <p className="text-[10px] text-[#94a3b8] pt-1">
                        Deposit is held at checkout and fully refunded on successful return.
                      </p>
                    )}
                  </div>
                )}

                {/* CTA buttons */}
                <div className="space-y-2.5">
                  <ContactSellerButton
                    listingId={listing.id}
                    listingType={listing.listing_type}
                    isOwnListing={isOwnListing}
                    isLoggedIn={!!currentUser}
                  />
                  <Link
                    href="/browse"
                    className="w-full py-2.5 px-4 border border-[#e5e7eb] text-[#374151] text-sm font-medium rounded-lg hover:bg-[#f8fafc] transition flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={15} />
                    Back to Browse
                  </Link>
                </div>

                {/* Trust note */}
                <p className="text-[10px] text-[#94a3b8] text-center">
                  Payments processed securely via Stripe. 4% platform fee applies.
                </p>
              </div>

              {/* Seller card */}
              <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide mb-3">Seller</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {sellerInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-[#0f172a]">{sellerName}</p>
                      {seller?.is_academic_verified && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[9px] font-bold">
                          <CheckCircle2 size={9} /> Verified
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#64748b]">
                      {seller?.average_rating && seller.total_reviews > 0 ? (
                        <span>⭐ {seller.average_rating.toFixed(1)} · {seller.total_reviews} review{seller.total_reviews !== 1 ? "s" : ""}</span>
                      ) : (
                        <span>No reviews yet</span>
                      )}
                    </div>
                  </div>
                </div>
                {seller?.created_at && (
                  <p className="text-[10px] text-[#94a3b8] mt-3">
                    Member since {new Date(seller.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>

              {/* Owner actions — only shown to listing owner */}
              {isOwnListing && (
                <div className="bg-white rounded-xl border border-[#e5e7eb] p-4">
                  <p className="text-xs font-bold text-[#94a3b8] uppercase tracking-wide mb-3">Manage Listing</p>
                  <div className="space-y-2">
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#f8fafc] border border-[#e5e7eb] text-sm font-semibold text-[#374151] hover:bg-[#f1f5f9] hover:border-[#d1d5db] transition"
                    >
                      <Pencil size={14} />
                      Edit Listing
                    </Link>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

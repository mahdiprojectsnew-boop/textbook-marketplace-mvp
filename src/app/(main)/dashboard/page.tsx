import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getFirstImageUrl } from "@/lib/supabase/images";
import {
  BookOpen, Plus, Pencil, Eye, CheckCircle2, GraduationCap,
  MessageCircle, LayoutGrid, AlertCircle, Archive, ArrowUpRight
} from "lucide-react";
import { ReactivateButton } from "./ReactivateButton";

// ─── Types ────────────────────────────────────────────────────
interface MyListing {
  id: string;
  listing_type: "sale" | "rental";
  condition: string;
  price: number;
  status: string;
  created_at: string;
  books: { title: string; author: string | null } | null;
  listing_images: { image_url: string; sort_order: number }[];
}

const CONDITION_LABELS: Record<string, string> = {
  like_new: "Like New", very_good: "Very Good",
  good: "Good", fair: "Fair", poor: "Poor",
};

const STATUS_META: Record<string, { label: string; dotColor: string; textColor: string }> = {
  active:   { label: "Active",   dotColor: "bg-green-400",  textColor: "text-green-700"  },
  inactive: { label: "Inactive", dotColor: "bg-[#94a3b8]",  textColor: "text-[#64748b]"  },
  sold:     { label: "Sold",     dotColor: "bg-blue-400",   textColor: "text-blue-700"   },
  rented:   { label: "Rented",   dotColor: "bg-purple-400", textColor: "text-purple-700" },
  pending:  { label: "Pending",  dotColor: "bg-amber-400",  textColor: "text-amber-700"  },
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Stat card ────────────────────────────────────────────────
function StatCard({
  label, value, icon, href, accent,
}: {
  label: string; value: number | string; icon: React.ReactNode;
  href: string; accent: string;
}) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-[#e5e7eb] p-4 hover:border-[#93c5fd] hover:shadow-sm transition group">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: accent + "20" }}>
          <span style={{ color: accent }}>{icon}</span>
        </div>
        <ArrowUpRight size={13} className="text-[#d1d5db] group-hover:text-[#1d4ed8] transition" />
      </div>
      <p className="text-2xl font-bold text-[#0f172a]">{value}</p>
      <p className="text-xs text-[#64748b] font-medium mt-0.5">{label}</p>
    </Link>
  );
}

// ─── Listing row ──────────────────────────────────────────────
function ListingRow({ listing }: { listing: MyListing }) {
  const imgUrl   = getFirstImageUrl(listing.listing_images);
  const status   = STATUS_META[listing.status] ?? STATUS_META.inactive;
  const isActive = listing.status === "active";

  return (
    <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e5e7eb] hover:border-[#e2e8f0] transition group">
      {/* Thumbnail */}
      <div className="w-12 h-12 rounded-lg bg-[#f1f5f9] flex items-center justify-center shrink-0 overflow-hidden border border-[#e5e7eb]">
        {imgUrl
          ? <img src={imgUrl} alt="" className="w-full h-full object-cover" />
          : <BookOpen size={18} className="text-[#94a3b8]" strokeWidth={1.5} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-[#0f172a] truncate max-w-xs">
            {listing.books?.title ?? "Untitled"}
          </p>
          <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f1f5f9] ${status.textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-[#64748b] flex-wrap">
          <span>${listing.price.toFixed(2)} · {listing.listing_type === "sale" ? "Sale" : "Rental"}</span>
          <span>{CONDITION_LABELS[listing.condition] ?? listing.condition}</span>
          <span className="hidden sm:block">{formatDate(listing.created_at)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Link href={`/listings/${listing.id}`}
          className="p-2 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition" title="View">
          <Eye size={15} />
        </Link>
        {isActive && (
          <Link href={`/listings/${listing.id}/edit`}
            className="p-2 rounded-lg text-[#64748b] hover:bg-[#eff6ff] hover:text-[#1d4ed8] transition" title="Edit">
            <Pencil size={15} />
          </Link>
        )}
        {listing.status === "inactive" && (
          <ReactivateButton listingId={listing.id} />
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Parallel fetches
  const [profileRes, listingsRes, convoRes, imagesRes] = await Promise.all([
    supabase
      .from("users")
      .select("first_name, last_name, role, is_academic_verified")
      .eq("id", user.id)
      .single(),

    supabase
      .from("listings")
      .select("id, listing_type, condition, price, status, created_at, books ( title, author )")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false }),

    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),

    // Flat image query — we'll join manually
    supabase
      .from("listing_images")
      .select("listing_id, image_url, sort_order"),
  ]);

  const profile   = profileRes.data;
  const allListings = (listingsRes.data ?? []) as unknown as Omit<MyListing, "listing_images">[];
  const convoCount  = convoRes.count ?? 0;
  const allImages   = imagesRes.data ?? [];

  // Group images by listing_id
  const imgMap: Record<string, { image_url: string; sort_order: number }[]> = {};
  for (const img of allImages) {
    if (!imgMap[img.listing_id]) imgMap[img.listing_id] = [];
    imgMap[img.listing_id].push({ image_url: img.image_url, sort_order: img.sort_order });
  }

  // Merge images into listings
  const listings: MyListing[] = allListings.map(l => ({
    ...l,
    listing_images: imgMap[l.id] ?? [],
  }));

  // Stats
  const active   = listings.filter(l => l.status === "active").length;
  const inactive = listings.filter(l => l.status === "inactive").length;
  const total    = listings.length;

  const firstName = profile?.first_name ?? null;
  const initials  = profile?.first_name
    ? `${profile.first_name[0]}${profile.last_name?.[0] ?? ""}`.toUpperCase()
    : (user.email?.[0] ?? "U").toUpperCase();
  const isVerified = profile?.is_academic_verified ?? false;

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <div className="max-w-5xl mx-auto px-5 py-8 space-y-7">

        {/* Welcome header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white font-bold">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0f172a]">
                {firstName ? `Hi, ${firstName} 👋` : "Dashboard"}
              </h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {profile?.role && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eff6ff] text-[#1d4ed8]">
                    <GraduationCap size={10} />
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                )}
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
                    <CheckCircle2 size={10} /> Academic Verified
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link href="/listings/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition self-start sm:self-auto">
            <Plus size={15} /> List & Book
          </Link>
        </div>

        {/* Verification nudge */}
        {!isVerified && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">Get your Academic Verified badge</p>
              <p className="text-xs text-amber-700 mt-0.5">Verify your .edu email to build trust with other students.</p>
            </div>
            <Link href="/profile/verify" className="text-xs font-bold text-amber-700 hover:underline shrink-0">
              Verify →
            </Link>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Active Listings"   value={active}   icon={<BookOpen size={18} />}      href="/dashboard#listings" accent="#1d4ed8" />
          <StatCard label="Inactive Listings" value={inactive} icon={<Archive size={18} />}       href="/dashboard#listings" accent="#64748b" />
          <StatCard label="Total Listings"    value={total}    icon={<LayoutGrid size={18} />}    href="/dashboard#listings" accent="#7c3aed" />
          <StatCard label="Conversations"     value={convoCount} icon={<MessageCircle size={18} />} href="/messages"          accent="#0891b2" />
        </div>

        {/* My Listings */}
        <div id="listings">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#0f172a]">My Listings</h2>
            {total > 0 && (
              <Link href="/listings/new"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#1d4ed8] hover:underline">
                <Plus size={12} /> New listing
              </Link>
            )}
          </div>

          {total === 0 ? (
            /* Empty state */
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] flex items-center justify-center mx-auto mb-4">
                <BookOpen size={24} className="text-[#94a3b8]" strokeWidth={1.5} />
              </div>
              <p className="font-bold text-[#374151]">No listings yet</p>
              <p className="text-sm text-[#94a3b8] mt-1">List your first textbook and start earning.</p>
              <Link href="/listings/new"
                className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition">
                <Plus size={14} /> Sell & Rent
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Active first */}
              {listings.filter(l => l.status === "active").map(l => (
                <ListingRow key={l.id} listing={l} />
              ))}
              {/* Then everything else */}
              {listings.filter(l => l.status !== "active").map(l => (
                <ListingRow key={l.id} listing={l} />
              ))}
            </div>
          )}
        </div>

        {/* Quick links footer */}
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: "Browse Sell & Rent Textbooks", desc: "Find books for your courses", href: "/browse", icon: "🔍" },
            { label: "Messages",         desc: "View your conversations",     href: "/messages", icon: "💬" },
            { label: "Sell & Rent",      desc: "Sell or rent your textbooks", href: "/listings/new", icon: "📚" },
          ].map(q => (
            <Link key={q.href} href={q.href}
              className="flex items-start gap-3 p-4 bg-white border border-[#e5e7eb] rounded-xl hover:border-[#93c5fd] hover:shadow-sm transition group">
              <span className="text-xl">{q.icon}</span>
              <div>
                <p className="text-sm font-semibold text-[#111827] group-hover:text-[#1d4ed8] transition">{q.label}</p>
                <p className="text-xs text-[#64748b] mt-0.5">{q.desc}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}

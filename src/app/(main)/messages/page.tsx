import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, MessageCircle, ChevronRight, Tag, RefreshCw } from "lucide-react";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: conversations } = await supabase
    .from("conversations")
    .select(`
      id, created_at, updated_at,
      listings ( id, listing_type, price,
        books ( title, author )
      ),
      buyer:users!conversations_buyer_id_fkey ( id, first_name, last_name ),
      seller:users!conversations_seller_id_fkey ( id, first_name, last_name )
    `)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const items = (conversations ?? []) as any[];

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link href="/dashboard" className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition">
            <BookOpen size={16} />
          </Link>
          <div className="w-px h-5 bg-[#e5e7eb]" />
          <h1 className="text-sm font-bold text-[#0f172a]">Messages</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-6">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#f1f5f9] flex items-center justify-center">
              <MessageCircle size={26} className="text-[#94a3b8]" strokeWidth={1.5} />
            </div>
            <div>
              <p className="font-bold text-[#374151]">No conversations yet</p>
              <p className="text-sm text-[#94a3b8] mt-1">When you contact a seller, your conversation will appear here.</p>
            </div>
            <Link href="/browse" className="mt-1 px-4 py-2 bg-[#1d4ed8] text-white text-sm font-semibold rounded-lg hover:bg-[#1e40af] transition">
              Browse listings
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((c) => {
              const listing = c.listings;
              const book = listing?.books;
              const isBuyer = c.buyer?.id === user.id;
              const other = isBuyer ? c.seller : c.buyer;
              const otherName = other?.first_name
                ? `${other.first_name} ${other.last_name ?? ""}`.trim()
                : "User";
              const otherInitial = (other?.first_name?.[0] ?? "?").toUpperCase();

              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#e5e7eb] hover:border-[#93c5fd] hover:shadow-sm transition group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white text-sm font-bold shrink-0">
                    {otherInitial}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{otherName}</p>
                      <span className="text-[11px] text-[#94a3b8] shrink-0">{timeAgo(c.updated_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {listing?.listing_type === "sale"
                        ? <Tag size={10} className="text-[#1d4ed8] shrink-0" />
                        : <RefreshCw size={10} className="text-purple-600 shrink-0" />
                      }
                      <p className="text-xs text-[#64748b] truncate">
                        {book?.title ?? "Book"} · ${listing?.price?.toFixed(2) ?? "—"}
                      </p>
                    </div>
                  </div>

                  <ChevronRight size={15} className="text-[#cbd5e1] group-hover:text-[#1d4ed8] transition shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

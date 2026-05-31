import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, ChevronLeft, Tag, RefreshCw } from "lucide-react";
import { MessageInput } from "./MessageInput";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch conversation + participants + listing
  const { data: convo } = await supabase
    .from("conversations")
    .select(`
      id, created_at,
      buyer_id, seller_id,
      listings ( id, listing_type, price, status,
        books ( title, author )
      ),
      buyer:users!conversations_buyer_id_fkey ( id, first_name, last_name ),
      seller:users!conversations_seller_id_fkey ( id, first_name, last_name )
    `)
    .eq("id", id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single() as any;

  if (!convo) notFound();

  // Fetch messages
  const { data: msgs } = await supabase
    .from("conversation_messages")
    .select("id, body, sender_id, created_at, read_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  // Mark unread as read (fire-and-forget)
  supabase
    .from("conversation_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .neq("sender_id", user.id)
    .is("read_at", null)
    .then(() => {});

  const isBuyer = convo.buyer_id === user.id;
  const other = isBuyer ? convo.seller : convo.buyer;
  const otherName = other?.first_name
    ? `${other.first_name} ${other.last_name ?? ""}`.trim()
    : "User";
  const otherInitial = (other?.first_name?.[0] ?? "?").toUpperCase();
  const listing = convo.listings;
  const book = listing?.books;
  const messages = msgs ?? [];

  function formatTime(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString("en-US", {
      month: "short", day: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>

      {/* Header */}
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link href="/messages" className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition">
            <ChevronLeft size={18} />
          </Link>
          <div className="w-8 h-8 rounded-full bg-[#1d4ed8] flex items-center justify-center text-white text-sm font-bold shrink-0">
            {otherInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0f172a] truncate">{otherName}</p>
            <div className="flex items-center gap-1 text-[11px] text-[#64748b]">
              {listing?.listing_type === "sale"
                ? <Tag size={9} className="text-[#1d4ed8]" />
                : <RefreshCw size={9} className="text-purple-600" />
              }
              <span className="truncate">{book?.title ?? "Listing"} · ${listing?.price?.toFixed(2) ?? "—"}</span>
            </div>
          </div>
          {listing && (
            <Link
              href={`/listings/${convo.listings?.id}`}
              className="text-[11px] font-semibold text-[#1d4ed8] hover:underline hidden sm:block shrink-0"
            >
              View listing
            </Link>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 max-w-2xl w-full mx-auto px-5 py-5 space-y-3 pb-32">
        {messages.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm text-[#94a3b8]">No messages yet. Send the first one below.</p>
          </div>
        )}

        {messages.map((msg: any) => {
          const isMe = msg.sender_id === user.id;
          return (
            <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] space-y-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-[#1d4ed8] text-white rounded-br-sm"
                    : "bg-white text-[#111827] border border-[#e5e7eb] rounded-bl-sm"
                }`}>
                  {msg.body}
                </div>
                <p className={`text-[10px] text-[#94a3b8] px-1 ${isMe ? "text-right" : "text-left"}`}>
                  {formatTime(msg.created_at)}
                  {isMe && msg.read_at && (
                    <span className="ml-1 text-[#22c55e]">· Read</span>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply box — client component */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e7eb]">
        <div className="max-w-2xl mx-auto px-5 py-3">
          <MessageInput conversationId={id} />
        </div>
      </div>

    </div>
  );
}

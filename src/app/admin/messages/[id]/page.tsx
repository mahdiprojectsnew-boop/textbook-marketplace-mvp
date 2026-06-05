import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function AdminConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();

  const resolvedParams = await params;
  const conversationId = resolvedParams.id;

  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, listing_id, buyer_id, seller_id, created_at, updated_at")
    .eq("id", conversationId)
    .single();

  if (error || !conversation) notFound();

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title")
    .eq("id", conversation.listing_id)
    .maybeSingle();

  const { data: buyer } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("id", conversation.buyer_id)
    .maybeSingle();

  const { data: seller } = await supabase
    .from("users")
    .select("id, full_name, email")
    .eq("id", conversation.seller_id)
    .maybeSingle();

  const { data: messages } = await supabase
    .from("conversation_messages")
    .select("id, sender_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <div className="p-6">
      <AdminPageHeader
        section="MESSAGES"
        title="Conversation Detail"
        description="Review all messages inside this marketplace conversation."
      />

      <div className="mt-4">
        <Link
          href="/admin/messages"
          className="text-sm font-semibold text-blue-600 hover:underline"
        >
          ← Back to Messages
        </Link>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Listing
          </div>
          <div className="mt-2 font-semibold">
            {listing?.title || "No listing title"}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Buyer
          </div>
          <div className="mt-2 font-semibold">
            {buyer?.full_name || "Unknown buyer"}
          </div>
          <div className="text-xs text-gray-500">{buyer?.email || "—"}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-semibold uppercase text-gray-500">
            Seller
          </div>
          <div className="mt-2 font-semibold">
            {seller?.full_name || "Unknown seller"}
          </div>
          <div className="text-xs text-gray-500">{seller?.email || "—"}</div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border bg-white">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Messages</h2>
          <p className="text-xs text-gray-500">
            Conversation ID: {conversation.id}
          </p>
        </div>

        <div className="space-y-4 p-5">
          {!messages || messages.length === 0 ? (
            <div className="rounded-xl bg-gray-50 p-6 text-center text-sm text-gray-500">
              No messages found in this conversation.
            </div>
          ) : (
            messages.map((msg) => {
              const isBuyer = msg.sender_id === conversation.buyer_id;
              const sender = isBuyer ? buyer : seller;

              return (
                <div
                  key={msg.id}
                  className="rounded-xl border bg-gray-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">
                        {sender?.full_name || "Unknown user"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {isBuyer ? "Buyer" : "Seller"} •{" "}
                        {sender?.email || "No email"}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      {new Date(msg.created_at).toLocaleString()}
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap text-sm text-gray-800">
                    {msg.body}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
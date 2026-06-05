import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; filter?: string }>;
}) {
  const supabase = await createClient();

  const resolvedSearchParams = await searchParams;

  const q = (resolvedSearchParams?.q || "").trim().toLowerCase();
  const filter = resolvedSearchParams?.filter || "all";

  const { data: conversations, error } = await supabase
    .from("conversations")
    .select("id, listing_id, buyer_id, seller_id, created_at, updated_at")
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6">
        <AdminPageHeader
          section="MESSAGES"
          title="Messages"
          description="Review marketplace conversations and messages."
        />
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error.message}
        </div>
      </div>
    );
  }

  const listingIds = [...new Set((conversations || []).map((c) => c.listing_id).filter(Boolean))];
  const userIds = [
    ...new Set(
      (conversations || [])
        .flatMap((c) => [c.buyer_id, c.seller_id])
        .filter(Boolean)
    ),
  ];
  const conversationIds = (conversations || []).map((c) => c.id);

  const { data: listings } = await supabase
    .from("listings")
    .select("id, title")
    .in("id", listingIds);

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email")
    .in("id", userIds);

  const { data: messages } = await supabase
    .from("conversation_messages")
    .select("id, conversation_id, message, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });

  const listingMap = new Map((listings || []).map((l) => [l.id, l]));
  const userMap = new Map((users || []).map((u) => [u.id, u]));

  const rows =
    conversations?.map((c) => {
      const convoMessages = (messages || []).filter(
        (m) => m.conversation_id === c.id
      );

      const lastMessage = convoMessages[0];
      const buyer = userMap.get(c.buyer_id);
      const seller = userMap.get(c.seller_id);
      const listing = listingMap.get(c.listing_id);

      return {
        id: c.id,
        listing: listing?.title || "No listing title",
        buyerName: buyer?.full_name || "Unknown buyer",
        buyerEmail: buyer?.email || "",
        sellerName: seller?.full_name || "Unknown seller",
        sellerEmail: seller?.email || "",
        totalMessages: convoMessages.length,
        lastMessage: lastMessage?.message || "No messages yet",
        lastActivity: lastMessage?.created_at || c.updated_at || c.created_at,
      };
    }) || [];

  console.log("CONVERSATIONS:", conversations);
console.log("ROWS:", rows);
const filteredRows = rows.filter((row) => {
    const searchMatch =
      !q ||
      row.buyerName.toLowerCase().includes(q) ||
      row.buyerEmail.toLowerCase().includes(q) ||
      row.sellerName.toLowerCase().includes(q) ||
      row.sellerEmail.toLowerCase().includes(q) ||
      row.listing.toLowerCase().includes(q);

    const isActive = row.totalMessages > 0;
    const isRecent =
      Date.now() - new Date(row.lastActivity).getTime() <
      1000 * 60 * 60 * 24 * 7;

    const filterMatch =
      filter === "all" ||
      (filter === "active" && isActive) ||
      (filter === "recent" && isRecent);

    return searchMatch && filterMatch;
  });

  return (
    <div className="p-6">
      <AdminPageHeader
        section="MESSAGES"
        title="Messages"
        description="Review marketplace conversations and messages."
      />

      <form className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <input
          name="q"
          defaultValue={resolvedSearchParams?.q || ""}
          placeholder="Search buyer, seller, email, or listing..."
          className="w-full rounded-xl border px-4 py-2 text-sm md:max-w-md"
        />

        <select
          name="filter"
          defaultValue={filter}
          className="rounded-xl border px-4 py-2 text-sm"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="recent">Recent</option>
        </select>

        <button className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white">
          Search
        </button>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Conversation ID</th>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Buyer</th>
              <th className="px-4 py-3">Seller</th>
              <th className="px-4 py-3">Messages</th>
              <th className="px-4 py-3">Last Message</th>
              <th className="px-4 py-3">Last Activity</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No conversations found.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3 font-mono text-xs">
                    {row.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3">{row.listing}</td>
                  <td className="px-4 py-3">
                    <div>{row.buyerName}</div>
                    <div className="text-xs text-gray-500">{row.buyerEmail}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{row.sellerName}</div>
                    <div className="text-xs text-gray-500">{row.sellerEmail}</div>
                  </td>
                  <td className="px-4 py-3">{row.totalMessages}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-gray-600">
                    {row.lastMessage}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(row.lastActivity).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/messages/${row.id}`}
                      className="rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
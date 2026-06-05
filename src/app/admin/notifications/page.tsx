import { revalidatePath } from "next/cache";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { createClient } from "@/lib/supabase/server";

async function updateNotificationReadStatus(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const id = String(formData.get("id") || "");
  const isRead = String(formData.get("is_read")) === "true";

  if (!id) return;

  await supabase
    .from("notifications")
    .update({ is_read: isRead })
    .eq("id", id);

  revalidatePath("/admin/notifications");
}

export default async function AdminNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
  }>;
}) {
  const params = await searchParams;

  const q = (params.q || "").trim().toLowerCase();
  const status = params.status || "all";

  const supabase = await createClient();

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, user_id, type, title, body, is_read, created_at")
    .order("created_at", { ascending: false });

  const userIds = Array.from(
    new Set((notifications || []).map((n) => n.user_id).filter(Boolean))
  );

  const { data: users } =
    userIds.length > 0
      ? await supabase
          .from("users")
          .select("id, full_name, email")
          .in("id", userIds)
      : { data: [] };

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  const filteredNotifications = (notifications || []).filter((n) => {
    const user = userMap.get(n.user_id);

    const userText = `${user?.full_name || ""} ${user?.email || ""}`.toLowerCase();
    const titleText = `${n.title || ""}`.toLowerCase();

    const matchesSearch =
      !q || userText.includes(q) || titleText.includes(q);

    const matchesStatus =
      status === "all" ||
      (status === "read" && n.is_read === true) ||
      (status === "unread" && n.is_read !== true);

    return matchesSearch && matchesStatus;
  });

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <AdminPageHeader
          section="NOTIFICATIONS"
          title="Notifications"
          description="Review platform notifications."
        />

        <form className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_120px]">
            <input
              name="q"
              defaultValue={params.q || ""}
              placeholder="Search user, email, or title..."
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />

            <select
              name="status"
              defaultValue={status}
              className="rounded-xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="all">All</option>
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Search
            </button>
          </div>
        </form>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error.message}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Type</th>
                <th className="p-4">Title</th>
                <th className="p-4">Message</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created At</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    No notifications found.
                  </td>
                </tr>
              ) : (
                filteredNotifications.map((n) => {
                  const user = userMap.get(n.user_id);

                  return (
                    <tr key={n.id} className="border-t align-top">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">
                          {user?.full_name || "Unknown User"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {user?.email || "No email"}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                          {n.type || "general"}
                        </span>
                      </td>

                      <td className="p-4 font-medium text-slate-900">
                        {n.title || "Untitled"}
                      </td>

                      <td className="max-w-md p-4 text-slate-600">
                        {n.body || "No message"}
                      </td>

                      <td className="p-4">
                        {n.is_read ? (
                          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                            Read
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                            Unread
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-slate-500">
                        {n.created_at
                          ? new Date(n.created_at).toLocaleString()
                          : "-"}
                      </td>

                      <td className="p-4 text-right">
                        <form action={updateNotificationReadStatus}>
                          <input type="hidden" name="id" value={n.id} />
                          <input
                            type="hidden"
                            name="is_read"
                            value={n.is_read ? "false" : "true"}
                          />

                          <button
                            type="submit"
                            className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                          >
                            {n.is_read ? "Mark Unread" : "Mark Read"}
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
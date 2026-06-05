import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { Search, UserCheck, UserX } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function updateUserStatus(formData: FormData) {
  "use server";

  const supabaseAction = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const userId = String(formData.get("user_id") || "");
  const action = String(formData.get("action") || "");

  if (!userId) return;

  const { error } = await supabaseAction
    .from("users")
    .update({
  is_active: action === "activate",
})
    .eq("id", userId);

  if (error) {
    console.error("User status update error:", error.message);
  }

  revalidatePath("/admin/users");
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    filter?: string;
  }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").trim().toLowerCase();
  const filter = params.filter || "all";

  const { data: users } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: universities } = await supabaseAdmin
    .from("universities")
    .select("id, name");

  const universityMap = new Map(
    (universities || []).map((u: any) => [u.id, u.name])
  );

  const filteredUsers = (users || []).filter((user: any) => {
    const universityName =
      universityMap.get(user.university_id) ||
      user.university ||
      user.university_name ||
      "";

    const fullName =
      user.full_name ||
      user.name ||
      `${user.first_name || ""} ${user.last_name || ""}`.trim();

    const matchesSearch =
      !q ||
      user.id?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q) ||
      fullName?.toLowerCase().includes(q) ||
      universityName?.toLowerCase().includes(q);

    const isActive = user.is_active !== false;
    const isVerified =
      user.academic_verified === true ||
      user.is_verified === true ||
      user.edu_verified === true;

    const matchesFilter =
      filter === "all" ||
      (filter === "active" && isActive) ||
      (filter === "inactive" && !isActive) ||
      (filter === "verified" && isVerified) ||
      (filter === "unverified" && !isVerified);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <AdminPageHeader
          section="USERS"
          title="Users"
          description="Manage registered users and account status."
        />

        <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
          <form className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                name="q"
                defaultValue={params.q || ""}
                placeholder="Search name, email, university, or user ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
              />
            </div>

            <select
              name="filter"
              defaultValue={filter}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="all">All Users</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition"
            >
              Apply
            </button>
          </form>
        </div>

        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="text-left px-5 py-4 font-semibold">Full Name</th>
                  <th className="text-left px-5 py-4 font-semibold">Email</th>
                  <th className="text-left px-5 py-4 font-semibold">University</th>
                  <th className="text-left px-5 py-4 font-semibold">Role</th>
                  <th className="text-left px-5 py-4 font-semibold">Academic Verification</th>
                  <th className="text-left px-5 py-4 font-semibold">Created At</th>
                  <th className="text-left px-5 py-4 font-semibold">Account Status</th>
                  <th className="text-right px-5 py-4 font-semibold">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user: any) => {
                    const fullName =
                      user.full_name ||
                      user.name ||
                      `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                      "—";

                    const universityName =
                      universityMap.get(user.university_id) ||
                      user.university ||
                      user.university_name ||
                      "—";

                    const isActive = user.is_active !== false;

                    const isVerified =
                      user.academic_verified === true ||
                      user.is_verified === true ||
                      user.edu_verified === true;

                    return (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 font-medium text-slate-900">
                          {fullName}
                          <div className="text-xs text-slate-400 mt-1">
                            ID: {user.id}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {user.email || "—"}
                        </td>

                        <td className="px-5 py-4 text-slate-700">
                          {universityName}
                        </td>

                        <td className="px-5 py-4">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
                            {user.role || "student"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isVerified
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {isVerified ? "Verified" : "Unverified"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : "—"}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isActive
                                ? "bg-blue-100 text-blue-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {isActive ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {isActive ? (
                              <form action={updateUserStatus}>
                                <input type="hidden" name="user_id" value={user.id} />
                                <input type="hidden" name="action" value="deactivate" />
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition"
                                >
                                  <UserX size={14} />
                                  Deactivate
                                </button>
                              </form>
                            ) : (
                              <form action={updateUserStatus}>
                                <input type="hidden" name="user_id" value={user.id} />
                                <input type="hidden" name="action" value="activate" />
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition"
                                >
                                  <UserCheck size={14} />
                                  Activate
                                </button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
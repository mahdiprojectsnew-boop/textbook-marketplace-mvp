import { cookies } from "next/headers";
import { redirect } from "next/navigation";

async function adminLogin(formData: FormData) {
  "use server";

  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/admin");

  const adminPassword = process.env.ADMIN_TEST_PASSWORD;

  if (!adminPassword) {
    redirect("/admin/login?error=missing-env");
  }

  if (password !== adminPassword) {
    redirect("/admin/login?error=1");
  }

  const cookieStore = await cookies();

  cookieStore.set("admin_session", "active", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect(next.startsWith("/admin") ? next : "/admin");
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string;
    error?: string;
  }>;
}) {
  const params = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 shadow-sm p-8">
        <p className="text-sm font-semibold text-blue-600 uppercase text-center">
          Admin Login
        </p>

        <h1 className="text-2xl font-bold text-slate-900 mt-2 text-center">
          Textbook Rescue Admin
        </h1>

        <p className="text-slate-600 mt-3 text-center">
          Enter the admin password to continue.
        </p>

        {params.error === "missing-env" && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Admin password is not configured in production.
          </div>
        )}

        {params.error === "1" && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Wrong password. Try again.
          </div>
        )}

        <form action={adminLogin} className="mt-6 space-y-4">
          <input type="hidden" name="next" value={params.next || "/admin"} />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Admin Password
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="Enter admin password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Login to Admin
          </button>
        </form>
      </div>
    </main>
  );
}
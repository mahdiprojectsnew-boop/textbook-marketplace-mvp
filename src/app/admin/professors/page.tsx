import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { addProfessor, toggleProfessorStatus } from "./actions";

export default async function AdminProfessorsPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const supabase = createServiceClient();
  const params = await searchParams;
  const q = params?.q?.trim() || "";

  let query = supabase
    .from("professors")
    .select(
  "id, first_name, last_name, email, university_id, department_id, is_active, source, created_at, updated_at, universities(name)"
)
    .order("last_name", { ascending: true })
    .limit(100);

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`
    );
  }

const { data: universities } = await supabase
  .from("universities")
  .select("id, name")
  .eq("is_active", true)
  .order("name", { ascending: true });

  const { data: professors, error } = await query;

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-sm font-semibold text-blue-600">
            ← Back to Admin
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-700">
              Error loading professors
            </h1>
            <p className="mt-2 text-sm text-red-600">{error.message}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="max-w-7xl mx-auto">
        <Link href="/admin" className="text-sm font-semibold text-blue-600">
          ← Back to Admin
        </Link>

        <div className="mt-6 mb-8">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
            Admin / Professors
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            Professors
          </h1>
          <p className="text-slate-600 mt-2">
            Showing {professors?.length ?? 0} professor records from Supabase.
          </p>
        </div>

        <form className="mb-6 flex gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by professor name or email..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm"
          />

          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Search
          </button>

          {q && (
            <Link
              href="/admin/professors"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Clear
            </Link>
          )}
        </form>

        <form
          action={addProfessor}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">Add Professor</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <input
              name="first_name"
              required
              placeholder="First name"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
            <input
              name="last_name"
              required
              placeholder="Last name"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
<select
  name="university_id"
  required
  className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
>
  <option value="">Select university</option>
  {universities?.map((university) => (
    <option key={university.id} value={university.id}>
      {university.name}
    </option>
  ))}
</select>
            <input
              name="email"
              placeholder="Email"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add Professor
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">University </th>
                <th className="px-4 py-3 font-semibold">Department ID</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {professors?.map((professor) => (
                <tr key={professor.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {professor.first_name} {professor.last_name}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {professor.email || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {(professor.universities as { name?: string } | null)?.name || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {professor.department_id || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {professor.source || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        professor.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {professor.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <form action={toggleProfessorStatus}>
                      <input type="hidden" name="id" value={professor.id} />
                      <input
                        type="hidden"
                        name="is_active"
                        value={professor.is_active ? "true" : "false"}
                      />

                      <button
                        type="submit"
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          professor.is_active
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {professor.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {!professors?.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No professors found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
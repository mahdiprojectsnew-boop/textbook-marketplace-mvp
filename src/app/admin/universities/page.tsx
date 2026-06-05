import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { addUniversity, toggleUniversityStatus } from "./actions";

export default async function AdminUniversitiesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const supabase = createServiceClient();
  const params = await searchParams;
  const q = params?.q?.trim() || "";

  let cityIds: string[] = [];

  if (q) {
    const { data: matchingCities } = await supabase
      .from("cities")
      .select("id")
      .ilike("name", `%${q}%`)
      .limit(50);

    cityIds = matchingCities?.map((city) => city.id) ?? [];
  }

  let query = supabase
    .from("universities")
    .select(
      "id, name, slug, city_id, state, website, is_active, source, created_at, updated_at, cities(name)"
    )
    .order("name", { ascending: true })
    .limit(100);

  if (q) {
    const filters = [
      `name.ilike.%${q}%`,
      `state.ilike.%${q}%`,
      `website.ilike.%${q}%`,
    ];

    if (cityIds.length > 0) {
      filters.push(`city_id.in.(${cityIds.join(",")})`);
    }

    query = query.or(filters.join(","));
  }

  const { data: universities, error } = await query;

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-sm font-semibold text-blue-600">
            ← Back to Admin
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-700">
              Error loading universities
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
            Admin / Universities
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            Universities
          </h1>
          <p className="text-slate-600 mt-2">
            Showing {universities?.length ?? 0} university records from Supabase.
          </p>
        </div>

        <form className="mb-6 flex gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by university, city, state, or website..."
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
              href="/admin/universities"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Clear
            </Link>
          )}
        </form>

        <form
          action={addUniversity}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">Add University</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <input
              name="name"
              required
              placeholder="University name"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
            <input
              name="city"
              placeholder="City, e.g. Los Angeles"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
            <input
              name="state"
              maxLength={2}
              placeholder="State, e.g. CA"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
            <input
              name="website"
              placeholder="Website"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add University
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">State</th>
                <th className="px-4 py-3 font-semibold">Website</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {universities?.map((uni) => (
                <tr key={uni.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {uni.name}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {(uni.cities as { name?: string } | null)?.name || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {uni.state || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {uni.website ? (
                      <a
                        href={uni.website}
                        target="_blank"
                        className="text-blue-600 hover:underline"
                      >
                        Website
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {uni.source || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        uni.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {uni.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <form action={toggleUniversityStatus}>
                      <input type="hidden" name="id" value={uni.id} />
                      <input
                        type="hidden"
                        name="is_active"
                        value={uni.is_active ? "true" : "false"}
                      />

                      <button
                        type="submit"
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          uni.is_active
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {uni.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {!universities?.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No universities found.
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
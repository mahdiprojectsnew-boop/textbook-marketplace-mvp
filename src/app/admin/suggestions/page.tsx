import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { updateSuggestionStatus } from "./actions";

export default async function AdminSuggestionsPage() {
  const supabase = createServiceClient();

  const { data: suggestions, error } = await supabase
    .from("suggestions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-sm font-semibold text-blue-600">
            ← Back to Admin
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-700">
              Error loading suggestions
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
            Admin / Suggestions
          </p>

          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            Suggestions
          </h1>

          <p className="text-slate-600 mt-2">
            Showing {suggestions?.length ?? 0} suggestion records.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Submitted By</th>
                <th className="px-4 py-3 font-semibold">Created</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {suggestions?.map((suggestion: any) => (
                <tr key={suggestion.id}>
                  <td className="px-4 py-3">
                    {suggestion.suggestion_type || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {suggestion.status || "pending"}
                  </td>

                  <td className="px-4 py-3">
                    {suggestion.submitted_by || "—"}
                  </td>

                  <td className="px-4 py-3">
                    {suggestion.created_at
                      ? new Date(suggestion.created_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <form action={updateSuggestionStatus}>
                        <input
                          type="hidden"
                          name="id"
                          value={suggestion.id}
                        />
                        <input
                          type="hidden"
                          name="status"
                          value="approved"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                        >
                          Approve
                        </button>
                      </form>

                      <form action={updateSuggestionStatus}>
                        <input
                          type="hidden"
                          name="id"
                          value={suggestion.id}
                        />
                        <input
                          type="hidden"
                          name="status"
                          value="rejected"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                        >
                          Reject
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}

              {!suggestions?.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No suggestions found.
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
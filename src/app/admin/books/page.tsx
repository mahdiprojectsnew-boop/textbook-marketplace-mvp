import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { addBook, toggleBookStatus } from "./actions";

export default async function AdminBooksPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const supabase = createServiceClient();
  const params = await searchParams;
  const q = params?.q?.trim() || "";

  const { data: courses } = await supabase
    .from("courses")
    .select("id, name, code")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: professors } = await supabase
    .from("professors")
    .select("id, first_name, last_name")
    .eq("is_active", true)
    .order("last_name", { ascending: true });

  let query = supabase
    .from("books")
    .select(
      "id, title, author, isbn, edition, publisher, year, cover_image_url, is_active, source, created_at"
    )
    .order("title", { ascending: true })
    .limit(100);

  if (q) {
    query = query.or(
      `title.ilike.%${q}%,author.ilike.%${q}%,isbn.ilike.%${q}%`
    );
  }

  const { data: books, error } = await query;

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-sm font-semibold text-blue-600">
            ← Back to Admin
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-700">
              Error loading books
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
            Admin / Books
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Books</h1>
          <p className="text-slate-600 mt-2">
            Showing {books?.length ?? 0} book records from Supabase.
          </p>
        </div>

        <form className="mb-6 flex gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search books by title, author, or ISBN..."
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
              href="/admin/books"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Clear
            </Link>
          )}
        </form>

        <form
          action={addBook}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">Add Book</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              name="title"
              required
              placeholder="Book title"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              name="author"
              required
              placeholder="Author"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              name="isbn"
              placeholder="ISBN"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              name="edition"
              placeholder="Edition"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              name="publisher"
              placeholder="Publisher"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              name="year"
              type="number"
              placeholder="Book year"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              name="cover_image_url"
              placeholder="Cover image URL"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <select
              name="course_id"
              required
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="">Select course</option>
              {courses?.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.code ? `${course.code} — ${course.name}` : course.name}
                </option>
              ))}
            </select>

            <select
              name="professor_id"
              required
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="">Select professor</option>
              {professors?.map((professor: any) => (
                <option key={professor.id} value={professor.id}>
                  {professor.first_name} {professor.last_name}
                </option>
              ))}
            </select>

            <input
              name="semester"
              placeholder="Semester, e.g. Fall"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              name="link_year"
              type="number"
              placeholder="Academic year, e.g. 2026"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              name="link"
              placeholder="Reference link / syllabus link"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />
          </div>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add Book
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Book</th>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 font-semibold">ISBN</th>
                <th className="px-4 py-3 font-semibold">Edition</th>
                <th className="px-4 py-3 font-semibold">Year</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {books?.map((book: any) => (
                <tr key={book.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {book.title}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {book.author || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {book.isbn || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {book.edition || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {book.year || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {book.source || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        book.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {book.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <form action={toggleBookStatus}>
                      <input type="hidden" name="id" value={book.id} />
                      <input
                        type="hidden"
                        name="is_active"
                        value={book.is_active ? "true" : "false"}
                      />

                      <button
                        type="submit"
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          book.is_active
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {book.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {!books?.length && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No books found.
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
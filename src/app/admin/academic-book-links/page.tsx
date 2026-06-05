import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";
import {
  addAcademicBookLink,
  getAcademicBookLinks,
  toggleAcademicBookLink,
} from "./actions";
import { Link2, PlusCircle, Search } from "lucide-react";

export default async function AcademicBookLinksPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const search = params?.q || "";
  const { links, professors, courses, books } =
    await getAcademicBookLinks(search);

  return (
    <div className="space-y-8">
      <AdminPageHeader
  section="SUGGESTIONS"
  title="Suggestions"
  description="Review user-submitted academic data and marketplace suggestions."
/>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
            <PlusCircle className="text-blue-700" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Add Academic Book Link
            </h2>
            <p className="text-sm text-gray-500">
              Example: Professor Smith teaches BIO 101 using Biology 12th Edition.
            </p>
          </div>
        </div>

        <form action={addAcademicBookLink} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Professor
            </label>
            <select
              name="professor_id"
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm"
            >
              <option value="">Select professor</option>
              {professors.map((professor: any) => (
                <option key={professor.id} value={professor.id}>
                  {professor.first_name} {professor.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course
            </label>
            <select
              name="course_id"
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm"
            >
              <option value="">Select course</option>
              {courses.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.code} — {course.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Book
            </label>
            <select
              name="book_id"
              required
              className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm"
            >
              <option value="">Select book</option>
              {books.map((book: any) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                  {book.author ? ` — ${book.author}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Semester
              </label>
              <input
                name="semester"
                placeholder="Fall"
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Year
              </label>
              <input
                name="year"
                type="number"
                placeholder="2026"
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            >
              <Link2 size={18} />
              Add Link
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
            <Search className="text-gray-700" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Existing Links
            </h2>
            <p className="text-sm text-gray-500">
              Search and manage academic book relationships.
            </p>
          </div>
        </div>

        <form className="mb-6">
          <input
            name="q"
            defaultValue={search}
            placeholder="Search professor, course, book, semester, or year..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm"
          />
        </form>

        {links.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl">
            <p className="text-gray-500">No academic book links found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((item: any) => (
              <div
                key={item.id}
                className="border border-gray-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
              >
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900">
                    {item.book_title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Professor: {item.professor_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Course: {item.course_name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.semester || "No semester"}{" "}
                    {item.year ? `• ${item.year}` : ""}
                  </p>
                  {item.link && (
                    <p className="text-sm text-blue-600 break-all">
                      {item.link}
                    </p>
                  )}
                </div>

                <form action={toggleAcademicBookLink}>
                  <input type="hidden" name="id" value={item.id} />
                  <input
                    type="hidden"
                    name="current_status"
                    value={String(item.is_active)}
                  />
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                      item.is_active
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {item.is_active ? "Deactivate" : "Activate"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
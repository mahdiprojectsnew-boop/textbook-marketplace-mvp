import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { addCourse, toggleCourseStatus } from "./actions";

export default async function AdminCoursesPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const supabase = createServiceClient();
  const params = await searchParams;
  const q = params?.q?.trim() || "";

  const { data: universities } = await supabase
    .from("universities")
    .select("id, name")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, university_id")
    .eq("is_active", true)
    .order("name", { ascending: true });

  let query = supabase
    .from("courses")
    .select(
      "id, name, code, university_id, department_id, is_active, source, created_at, universities(name), departments(name)"
    )
    .order("name", { ascending: true })
    .limit(100);

  if (q) {
    query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%`);
  }

  const { data: courses, error } = await query;

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="max-w-6xl mx-auto">
          <Link href="/admin" className="text-sm font-semibold text-blue-600">
            ← Back to Admin
          </Link>

          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-bold text-red-700">
              Error loading courses
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
            Admin / Courses
          </p>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">Courses</h1>
          <p className="text-slate-600 mt-2">
            Showing {courses?.length ?? 0} course records from Supabase.
          </p>
        </div>

        <form className="mb-6 flex gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search courses..."
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
              href="/admin/courses"
              className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
            >
              Clear
            </Link>
          )}
        </form>

        <form
          action={addCourse}
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-bold text-slate-900">Add Course</h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              name="name"
              required
              placeholder="Course name, e.g. Introduction to Biology"
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            />

            <input
              name="code"
              required
              placeholder="Course code, e.g. BIO 101"
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

            <select
              name="department_id"
              required
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm"
            >
              <option value="">Select department</option>
              {departments?.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="mt-4 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add Course
          </button>
        </form>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">University</th>
                <th className="px-4 py-3 font-semibold">Department</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {courses?.map((course) => (
                <tr key={course.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {course.name}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {course.code || "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {(course.universities as { name?: string } | null)?.name ||
                      "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {(course.departments as { name?: string } | null)?.name ||
                      "—"}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {course.source || "—"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        course.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {course.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <form action={toggleCourseStatus}>
                      <input type="hidden" name="id" value={course.id} />
                      <input
                        type="hidden"
                        name="is_active"
                        value={course.is_active ? "true" : "false"}
                      />

                      <button
                        type="submit"
                        className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                          course.is_active
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {course.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}

              {!courses?.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No courses found.
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
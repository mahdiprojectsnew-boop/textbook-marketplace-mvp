"use client";

import { useFormStatus } from "react-dom";
import { Upload } from "lucide-react";
import { importExcel } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
    >
      <Upload size={18} />
      {pending ? "Importing..." : "Upload & Import"}
    </button>
  );
}

export default function ImportForm() {
  return (
    <form action={importExcel} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Excel File
        </label>
        <input
          type="file"
          name="file"
          accept=".xlsx,.xls,.csv"
          required
          className="block w-full text-sm text-gray-700 border border-gray-300 rounded-xl p-3"
        />
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          What does this file include?
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <label className="flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" name="universities" />
            <span>Universities</span>
          </label>

          <label className="flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" name="departments" />
            <span>Departments</span>
          </label>

          <label className="flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" name="professors" />
            <span>Professors</span>
          </label>

          <label className="flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" name="courses" />
            <span>Courses</span>
          </label>

          <label className="flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" name="books" />
            <span>Books</span>
          </label>

          <label className="flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" name="academic_book_links" />
            <span>Academic Book Links</span>
          </label>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          MVP note: the first working importer currently imports professors,
          universities, and departments from the professor Excel format.
        </p>
      </div>

      <SubmitButton />
    </form>
  );
}
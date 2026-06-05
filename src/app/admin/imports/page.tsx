import { getExcelImportLogs } from "./actions";
import { FileSpreadsheet, History } from "lucide-react";
import ImportForm from "./ImportForm";
import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";

export default async function AdminImportsPage() {
  const logs = await getExcelImportLogs();

  return (
    <div className="space-y-8">
      <AdminPageHeader
  section="IMPORTS"
  title="Excel Imports"
  description="Upload Excel files and manually choose what data should be imported."
/>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
            <FileSpreadsheet className="text-blue-700" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Excel File
            </h2>
            <p className="text-sm text-gray-500">
              The file will be processed and discarded. Only the result will be
              saved in import logs.
            </p>
          </div>
        </div>

        <ImportForm />
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center">
            <History className="text-gray-700" size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Excel Import Logs
            </h2>
            <p className="text-sm text-gray-500">
              Import results, warnings, and errors.
            </p>
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl">
            <p className="text-gray-500">No import logs yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log: any) => (
              <div
                key={log.id}
                className="border border-gray-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {log.file_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {log.imported_at
                        ? new Date(log.imported_at).toLocaleString()
                        : "No date"}
                    </p>
                  </div>

                  <span className="inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                    {log.status}
                  </span>
                </div>

                {log.summary && (
                  <pre className="bg-gray-50 rounded-xl p-3 text-xs overflow-auto">
                    {JSON.stringify(log.summary, null, 2)}
                  </pre>
                )}

                {log.errors && log.errors.length > 0 && (
                  <pre className="bg-red-50 text-red-700 rounded-xl p-3 text-xs overflow-auto">
                    {JSON.stringify(log.errors, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
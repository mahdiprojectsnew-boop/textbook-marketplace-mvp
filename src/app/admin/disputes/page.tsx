import { AdminPageHeader } from "../../../components/admin/AdminPageHeader";
import { createClient } from "@supabase/supabase-js";
import { AlertTriangle, FileText, User, CreditCard } from "lucide-react";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function text(value: any) {
  return value || "—";
}

function date(value: any) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function statusClass(status: string) {
  switch (status) {
    case "open":
      return "bg-yellow-100 text-yellow-800";
    case "under_review":
      return "bg-blue-100 text-blue-800";
    case "resolved":
      return "bg-green-100 text-green-800";
    case "closed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-orange-100 text-orange-800";
  }
}

export default async function AdminDisputesPage() {
  const { data: disputes, error } = await supabaseAdmin
    .from("disputes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Disputes Error</h1>
        <p className="mt-3 text-sm text-gray-700">{error.message}</p>
      </div>
    );
  }

  const disputeIds = [...new Set((disputes || []).map((d) => d.id).filter(Boolean))];

  const transactionIds = [
    ...new Set((disputes || []).map((d) => d.transaction_id).filter(Boolean)),
  ];

  const userIds = [
    ...new Set((disputes || []).map((d) => d.opened_by).filter(Boolean)),
  ];

  const { data: evidence } =
    disputeIds.length > 0
      ? await supabaseAdmin
          .from("dispute_evidence")
          .select("*")
          .in("dispute_id", disputeIds)
          .order("uploaded_at", { ascending: false })
      : { data: [] };

  const { data: transactions } =
    transactionIds.length > 0
      ? await supabaseAdmin
          .from("transactions")
          .select("*")
          .in("id", transactionIds)
      : { data: [] };

  const { data: users } =
    userIds.length > 0
      ? await supabaseAdmin.from("users").select("*").in("id", userIds)
      : { data: [] };

  const evidenceByDispute = new Map<string, any[]>();

  for (const item of evidence || []) {
    const list = evidenceByDispute.get(item.dispute_id) || [];
    list.push(item);
    evidenceByDispute.set(item.dispute_id, list);
  }

  const transactionMap = new Map((transactions || []).map((t: any) => [t.id, t]));
  const userMap = new Map((users || []).map((u: any) => [u.id, u]));

  return (
    <div className="p-8 space-y-8">
      <AdminPageHeader
  section="DISPUTES"
  title="Disputes"
  description="Review evidence, manage disputes, and resolve transaction conflicts."
/>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">Total Disputes</p>
          <p className="text-2xl font-bold">{disputes?.length || 0}</p>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-2xl font-bold">
            {(disputes || []).filter((d: any) => d.status === "open").length}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold">
            {(disputes || []).filter((d: any) => d.status === "resolved").length}
          </p>
        </div>

        <div className="bg-white border rounded-2xl p-5">
          <p className="text-sm text-gray-500">Evidence Files</p>
          <p className="text-2xl font-bold">{evidence?.length || 0}</p>
        </div>
      </div>

      <div className="space-y-4">
        {(disputes || []).length === 0 && (
          <div className="bg-white border rounded-2xl p-8 text-center text-gray-500">
            No disputes found.
          </div>
        )}

        {(disputes || []).map((dispute: any) => {
          const tx = transactionMap.get(dispute.transaction_id) as any;
          const opener = userMap.get(dispute.opened_by) as any;
          const files = evidenceByDispute.get(dispute.id) || [];
          const openerName = `${opener?.first_name || ""} ${opener?.last_name || ""}`.trim();

          return (
            <div key={dispute.id} className="bg-white border rounded-2xl p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={20} className="text-orange-500" />
                    <h2 className="text-lg font-bold text-gray-900">
                      Dispute #{String(dispute.id).slice(0, 8)}
                    </h2>
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    Created: {date(dispute.created_at)}
                  </p>
                </div>

                <span
                  className={`inline-flex w-fit px-3 py-1 rounded-full text-sm font-semibold ${statusClass(
                    dispute.status
                  )}`}
                >
                  {text(dispute.status).replaceAll("_", " ")}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <CreditCard size={16} />
                    Transaction
                  </div>
                  <p className="font-mono text-sm break-all">
                    {text(dispute.transaction_id)}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Status: {text(tx?.status).replaceAll("_", " ")}
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: ${Number(tx?.amount || 0).toFixed(2)}
                  </p>
                </div>

                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
                    <User size={16} />
                    Opened By
                  </div>
                  <p className="font-semibold text-gray-900">{openerName || "—"}</p>
                  <p className="text-sm text-gray-600">{text(opener?.email)}</p>
                </div>

                <div className="border rounded-xl p-4">
                  <p className="text-gray-500 text-sm mb-2">Deposit Status</p>
                  <p className="font-semibold">
                    {text(dispute.deposit_status).replaceAll("_", " ")}
                  </p>
                </div>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-gray-500 text-sm mb-2">Description</p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap">
                  {text(dispute.description)}
                </p>
              </div>

              <div className="border rounded-xl p-4">
                <p className="text-gray-500 text-sm mb-3">Admin Review</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Admin Decision</p>
                    <p className="font-medium">{text(dispute.admin_decision)}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Resolved At</p>
                    <p className="font-medium">{date(dispute.resolved_at)}</p>
                  </div>

                  <div>
                    <p className="text-gray-500">Admin ID</p>
                    <p className="font-mono break-all">{text(dispute.admin_id)}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-gray-500 text-sm">Admin Notes</p>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {text(dispute.admin_notes)}
                  </p>
                </div>
              </div>

              <details className="border rounded-xl p-4 bg-gray-50">
                <summary className="cursor-pointer font-semibold text-sm text-gray-800 flex items-center gap-2">
                  <FileText size={16} />
                  Evidence Files ({files.length})
                </summary>

                <div className="space-y-3 mt-4">
                  {files.length === 0 && (
                    <p className="text-sm text-gray-500">No evidence uploaded.</p>
                  )}

                  {files.map((file: any) => (
                    <div key={file.id} className="border rounded-xl p-4 bg-white">
                      <p className="text-sm font-semibold">
                        {text(file.file_type).replaceAll("_", " ")}
                      </p>

                      <p className="text-sm text-gray-600 mt-1">
                        Uploaded: {date(file.uploaded_at)}
                      </p>

                      <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">
                        {text(file.description)}
                      </p>

                      {file.file_url && (
                        <a
                          href={file.file_url}
                          target="_blank"
                          className="inline-flex mt-3 text-sm font-semibold text-blue-600 hover:underline"
                        >
                          Open Evidence File
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            </div>
          );
        })}
      </div>
    </div>
  );
}
"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const allowedStatuses = [
  "pending",
  "active",
  "exchange_pending",
  "meeting_confirmed",
  "book_received",
  "completed",
  "return_pending",
  "disputed",
  "cancelled",
  "refunded",
  "deposit_refunded",
  "deposit_captured",
];

export async function updateTransactionStatus(formData: FormData) {
  const transactionId = String(formData.get("transaction_id") || "");
  const status = String(formData.get("status") || "");

  if (!transactionId) {
    redirect("/admin/transactions?error=missing_transaction_id");
  }

  if (!allowedStatuses.includes(status)) {
    redirect("/admin/transactions?error=invalid_status_" + status);
  }

  const updateData: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "completed") {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("transactions")
    .update(updateData)
    .eq("id", transactionId)
    .select("id,status,updated_at")
    .single();

  if (error) {
    redirect(`/admin/transactions?error=${encodeURIComponent(error.message)}`);
  }

  if (!data) {
    redirect("/admin/transactions?error=no_row_updated");
  }

  revalidatePath("/admin/transactions");

  redirect(`/admin/transactions?updated=${data.status}`);
}
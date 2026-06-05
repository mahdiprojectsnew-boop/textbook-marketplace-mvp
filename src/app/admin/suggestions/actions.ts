"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function updateSuggestionStatus(formData: FormData) {
  const supabase = createServiceClient();

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();
  const adminNotes = String(formData.get("admin_notes") || "").trim();

  if (!id || !status) {
    throw new Error("Suggestion ID and status are required.");
  }

  const { error } = await supabase
    .from("suggestions")
    .update({
      status,
      admin_notes: adminNotes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/suggestions");
}
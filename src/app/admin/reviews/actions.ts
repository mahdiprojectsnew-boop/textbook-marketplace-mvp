"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateReviewLockStatus(formData: FormData) {
  const reviewId = String(formData.get("review_id") || "");
  const isLockedValue = String(formData.get("is_locked") || "");

  if (!reviewId) {
    redirect("/admin/reviews?error=missing_review_id");
  }

  const isLocked = isLockedValue === "true";

  const { data, error } = await supabaseAdmin
    .from("reviews")
    .update({
      is_locked: isLocked,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewId)
    .select("id,is_locked,updated_at")
    .single();

  if (error) {
    redirect(`/admin/reviews?error=${encodeURIComponent(error.message)}`);
  }

  if (!data) {
    redirect("/admin/reviews?error=no_row_updated");
  }

  revalidatePath("/admin/reviews");

  redirect(`/admin/reviews?updated=${isLocked ? "locked" : "unlocked"}`);
}
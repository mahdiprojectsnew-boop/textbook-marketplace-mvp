"use server";

import { createClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const allowedStatuses = ["active", "pending", "inactive", "sold", "rented"];

export async function updateListingStatus(formData: FormData) {
  const listingId = String(formData.get("listing_id") || "");
  const status = String(formData.get("status") || "");

  if (!listingId) {
    redirect("/admin/listings?error=missing_listing_id");
  }

  if (!allowedStatuses.includes(status)) {
    redirect("/admin/listings?error=invalid_status_" + status);
  }

  const { data, error } = await supabaseAdmin
    .from("listings")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .select("id,status,updated_at")
    .single();

  if (error) {
    redirect(`/admin/listings?error=${encodeURIComponent(error.message)}`);
  }

  if (!data) {
    redirect("/admin/listings?error=no_row_updated");
  }

  revalidatePath("/admin/listings");

  redirect(`/admin/listings?updated=${data.status}`);
}
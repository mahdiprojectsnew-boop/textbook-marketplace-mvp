"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function addDepartment(formData: FormData) {
  const supabase = createServiceClient();

  const name = String(formData.get("name") || "").trim();
  const universityId = String(formData.get("university_id") || "").trim();

  if (!name || !universityId) {
    throw new Error("Department name and university are required.");
  }

  const { error } = await supabase.from("departments").insert({
    name,
    university_id: universityId,
    is_active: true,
    source: "admin",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/departments");
}

export async function toggleDepartmentStatus(formData: FormData) {
  const supabase = createServiceClient();

  const id = String(formData.get("id") || "").trim();
  const isActive = String(formData.get("is_active")) === "true";

  if (!id) {
    throw new Error("Department ID is required.");
  }

  const { error } = await supabase
    .from("departments")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/departments");
}
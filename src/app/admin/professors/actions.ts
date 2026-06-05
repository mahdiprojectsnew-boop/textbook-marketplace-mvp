"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function addProfessor(formData: FormData) {
  const supabase = createServiceClient();

  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const universityId = String(formData.get("university_id") || "").trim();
  const email = String(formData.get("email") || "").trim();

 if (!firstName || !lastName || !universityId) {
  throw new Error("First name, last name, and university are required.");
}

  const { error } = await supabase.from("professors").insert({
    first_name: firstName,
    last_name: lastName,
    university_id: universityId,
    email: email || null,
    is_active: true,
    source: "admin",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/professors");
}

export async function toggleProfessorStatus(formData: FormData) {
  const supabase = createServiceClient();

  const id = String(formData.get("id") || "").trim();
  const isActive = String(formData.get("is_active")) === "true";

  if (!id) {
    throw new Error("Professor ID is required.");
  }

  const { error } = await supabase
    .from("professors")
    .update({
      is_active: !isActive,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/professors");
}
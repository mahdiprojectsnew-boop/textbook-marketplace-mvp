"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function addCourse(formData: FormData) {
  const supabase = createServiceClient();

  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const universityId = String(formData.get("university_id") || "").trim();
  const departmentId = String(formData.get("department_id") || "").trim();

  if (!name || !code || !universityId || !departmentId) {
    throw new Error("Course name, code, university and department are required.");
  }

  const { error } = await supabase.from("courses").insert({
    name,
    code,
    university_id: universityId,
    department_id: departmentId,
    is_active: true,
    source: "admin",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");
}

export async function toggleCourseStatus(formData: FormData) {
  const supabase = createServiceClient();

  const id = String(formData.get("id") || "").trim();
  const isActive = String(formData.get("is_active")) === "true";

  if (!id) {
    throw new Error("Course ID is required.");
  }

  const { error } = await supabase
    .from("courses")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/courses");
}
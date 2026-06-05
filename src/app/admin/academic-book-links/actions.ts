"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getAcademicBookLinks(search?: string) {
  const [{ data: links }, { data: professors }, { data: courses }, { data: books }] =
    await Promise.all([
      supabaseAdmin
        .from("academic_book_links")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("professors")
        .select("id, first_name, last_name")
        .eq("is_active", true)
        .order("last_name"),
      supabaseAdmin
        .from("courses")
        .select("id, name, code")
        .eq("is_active", true)
        .order("code"),
      supabaseAdmin
        .from("books")
        .select("id, title, author")
        .eq("is_active", true)
        .order("title"),
    ]);

  const professorMap = new Map(
    (professors || []).map((p: any) => [p.id, `${p.first_name} ${p.last_name}`])
  );

  const courseMap = new Map(
    (courses || []).map((c: any) => [c.id, `${c.code} — ${c.name}`])
  );

  const bookMap = new Map(
    (books || []).map((b: any) => [
      b.id,
      `${b.title}${b.author ? ` — ${b.author}` : ""}`,
    ])
  );

  let enrichedLinks = (links || []).map((link: any) => ({
    ...link,
    professor_name: professorMap.get(link.professor_id) || "Unknown professor",
    course_name: courseMap.get(link.course_id) || "Unknown course",
    book_title: bookMap.get(link.book_id) || "Unknown book",
  }));

  if (search) {
    const q = search.toLowerCase();

    enrichedLinks = enrichedLinks.filter((item: any) => {
      return (
        item.professor_name.toLowerCase().includes(q) ||
        item.course_name.toLowerCase().includes(q) ||
        item.book_title.toLowerCase().includes(q) ||
        String(item.semester || "").toLowerCase().includes(q) ||
        String(item.year || "").toLowerCase().includes(q)
      );
    });
  }

  return {
    links: enrichedLinks,
    professors: professors || [],
    courses: courses || [],
    books: books || [],
  };
}

export async function addAcademicBookLink(formData: FormData) {
  const professor_id = String(formData.get("professor_id") || "");
  const course_id = String(formData.get("course_id") || "");
  const book_id = String(formData.get("book_id") || "");
  const semester = String(formData.get("semester") || "").trim();
  const yearValue = String(formData.get("year") || "").trim();

  if (!professor_id || !course_id || !book_id) {
    return;
  }

  const year = yearValue ? Number(yearValue) : null;

  await supabaseAdmin.from("academic_book_links").insert({
    professor_id,
    course_id,
    book_id,
    semester: semester || null,
    year,
    is_active: true,
    source: "admin",
  });

  revalidatePath("/admin/academic-book-links");
}

export async function toggleAcademicBookLink(formData: FormData) {
  const id = String(formData.get("id") || "");
  const currentStatus = String(formData.get("current_status") || "");

  if (!id) return;

  await supabaseAdmin
    .from("academic_book_links")
    .update({
      is_active: currentStatus !== "true",
    })
    .eq("id", id);

  revalidatePath("/admin/academic-book-links");
}
"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function addBook(formData: FormData) {
  const supabase = createServiceClient();

  const title = String(formData.get("title") || "").trim();
  const author = String(formData.get("author") || "").trim();
  const isbn = String(formData.get("isbn") || "").trim();
  const edition = String(formData.get("edition") || "").trim();
  const publisher = String(formData.get("publisher") || "").trim();
  const year = String(formData.get("year") || "").trim();
  const coverImageUrl = String(formData.get("cover_image_url") || "").trim();

  const courseId = String(formData.get("course_id") || "").trim();
  const professorId = String(formData.get("professor_id") || "").trim();
  const semester = String(formData.get("semester") || "").trim();
  const linkYear = String(formData.get("link_year") || "").trim();
  const link = String(formData.get("link") || "").trim();

  if (!title || !author || !courseId || !professorId) {
    throw new Error("Title, author, course, and professor are required.");
  }

  const { data: book, error: bookError } = await supabase
    .from("books")
    .insert({
      title,
      author,
      isbn: isbn || null,
      edition: edition || null,
      publisher: publisher || null,
      year: year ? Number(year) : null,
      cover_image_url: coverImageUrl || null,
      is_active: true,
      source: "admin",
    })
    .select("id")
    .single();

  if (bookError) {
    throw new Error(bookError.message);
  }

  const { error: linkError } = await supabase.from("academic_book_links").insert({
    book_id: book.id,
    course_id: courseId,
    professor_id: professorId,
    semester: semester || null,
    year: linkYear ? Number(linkYear) : null,
    link: link || null,
    is_active: true,
    source: "admin",
  });

  if (linkError) {
    throw new Error(linkError.message);
  }

  revalidatePath("/admin/books");
}

export async function toggleBookStatus(formData: FormData) {
  const supabase = createServiceClient();

  const id = String(formData.get("id") || "").trim();
  const isActive = String(formData.get("is_active")) === "true";

  if (!id) {
    throw new Error("Book ID is required.");
  }

  const { error } = await supabase
    .from("books")
    .update({ is_active: !isActive })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/books");
}
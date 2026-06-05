"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import * as XLSX from "xlsx";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getCell(row: Record<string, any>, names: string[]) {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function splitProfessorName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return {
      first_name: parts[0],
      last_name: "",
    };
  }

  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

async function findOrCreateUniversity(name: string, state?: string) {
  const cleanName = name.trim();
  const cleanState = state?.trim() || null;
  const generatedSlug = slugify(cleanName);

  const { data: existing } = await supabaseAdmin
    .from("universities")
    .select("id")
    .eq("slug", generatedSlug)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabaseAdmin
    .from("universities")
    .insert({
      name: cleanName,
      slug: generatedSlug,
      state: cleanState,
      is_active: true,
      source: "excel",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function findOrCreateDepartment(name: string, universityId: string) {
  const cleanName = name.trim();

  const { data: existing } = await supabaseAdmin
    .from("departments")
    .select("id")
    .eq("name", cleanName)
    .eq("university_id", universityId)
    .maybeSingle();

  if (existing) return existing.id;

  const { data, error } = await supabaseAdmin
    .from("departments")
    .insert({
      name: cleanName,
      university_id: universityId,
      is_active: true,
      source: "excel",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

async function importProfessorRow(
  row: Record<string, any>,
  summary: any,
  errors: string[]
) {
  const professorName = getCell(row, ["Professor Name", "Professor", "Name"]);
  const universityName = getCell(row, [
    "College / University",
    "University",
    "College",
  ]);
  const departmentName = getCell(row, [
    "Department / School",
    "Department",
    "School",
  ]);
  const state = getCell(row, ["State"]);
  const email = getCell(row, ["Email", "Professor Email"]);

  if (!professorName || !universityName || !departmentName) {
    summary.skipped_rows++;
    return;
  }

  const universityId = await findOrCreateUniversity(universityName, state);
  summary.universities_created_or_found++;

  const departmentId = await findOrCreateDepartment(
    departmentName,
    universityId
  );
  summary.departments_created_or_found++;

  const { first_name, last_name } = splitProfessorName(professorName);

  let existingQuery = supabaseAdmin
    .from("professors")
    .select("id")
    .eq("university_id", universityId)
    .eq("first_name", first_name)
    .eq("last_name", last_name);

  if (email) {
    existingQuery = existingQuery.eq("email", email);
  }

  const { data: existingProfessor } = await existingQuery.maybeSingle();

  if (!existingProfessor) {
    const { error } = await supabaseAdmin.from("professors").insert({
      first_name,
      last_name,
      university_id: universityId,
      department_id: departmentId,
      email: email || null,
      is_active: true,
      source: "excel",
    });

    if (error) {
      errors.push(`Professor failed: ${professorName} - ${error.message}`);
      return;
    }
  }

  summary.professors_imported++;
}

async function importCourseRow(
  row: Record<string, any>,
  summary: any,
  errors: string[]
) {
  const courseCode = getCell(row, [
    "Course Code",
    "Code",
    "Course Number",
    "Class Code",
  ]);

  const courseName = getCell(row, [
    "Course Name",
    "Course",
    "Class Name",
    "Name",
  ]);

  const universityName = getCell(row, [
    "College / University",
    "University",
    "College",
  ]);

  const departmentName = getCell(row, [
    "Department / School",
    "Department",
    "School",
  ]);

  const state = getCell(row, ["State"]);

  if (!courseName || !courseCode || !universityName || !departmentName) {
    summary.skipped_rows++;
    return;
  }

  const universityId = await findOrCreateUniversity(universityName, state);
  summary.universities_created_or_found++;

  const departmentId = await findOrCreateDepartment(
    departmentName,
    universityId
  );
  summary.departments_created_or_found++;

  const { data: existingCourse } = await supabaseAdmin
    .from("courses")
    .select("id")
    .eq("code", courseCode)
    .eq("university_id", universityId)
    .eq("department_id", departmentId)
    .maybeSingle();

  if (!existingCourse) {
    const { error } = await supabaseAdmin.from("courses").insert({
      name: courseName,
      code: courseCode,
      university_id: universityId,
      department_id: departmentId,
      is_active: true,
      source: "excel",
    });

    if (error) {
      errors.push(`Course failed: ${courseCode} - ${error.message}`);
      return;
    }
  }

  summary.courses_imported++;
}

async function saveImportLog({
  fileName,
  status,
  summary,
  errors,
}: {
  fileName: string;
  status: "processing" | "completed" | "failed";
  summary: any;
  errors: string[];
}) {
  const { error } = await supabaseAdmin.from("excel_import_logs").insert({
    file_name: fileName,
    s3_key: null,
    status,
    summary,
    errors,
  });

  if (error) {
    console.error("IMPORT LOG SAVE ERROR:", error.message);
  }
}

export async function importExcel(formData: FormData) {
  const file = formData.get("file") as File | null;

  const importProfessors = formData.get("professors") === "on";
  const importCourses = formData.get("courses") === "on";
  const importBooks = formData.get("books") === "on";
  const importAcademicBookLinks =
    formData.get("academic_book_links") === "on";

  const summary = {
    skipped_rows: 0,
    checked_imports: {
      books: importBooks,
      courses: importCourses,
      professors: importProfessors,
      academic_book_links: importAcademicBookLinks,
    },
    professors_imported: 0,
    courses_imported: 0,
    universities_created_or_found: 0,
    departments_created_or_found: 0,
  };

  const errors: string[] = [];

  if (!file || file.size === 0) {
    errors.push("No Excel file uploaded.");

    await saveImportLog({
      fileName: "No file",
      status: "failed",
      summary,
      errors,
    });

    revalidatePath("/admin/imports");
    return;
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
    });

    if (!importProfessors && !importCourses) {
      errors.push(
        "For MVP, only Professors and Courses import are implemented."
      );
    }

    if (importBooks) {
      errors.push("Books import is not implemented yet.");
    }

    if (importAcademicBookLinks) {
      errors.push("Academic Book Links import is not implemented yet.");
    }

    for (const row of rows) {
      if (importProfessors) {
        await importProfessorRow(row, summary, errors);
      }

      if (importCourses) {
        await importCourseRow(row, summary, errors);
      }
    }

    await saveImportLog({
      fileName: file.name,
      status: errors.length > 0 ? "failed" : "completed",
      summary,
      errors,
    });
  } catch (error: any) {
    errors.push(error.message || "Unknown import error.");

    await saveImportLog({
      fileName: file.name,
      status: "failed",
      summary,
      errors,
    });
  }

  revalidatePath("/admin/imports");
}

export async function getExcelImportLogs() {
  const { data, error } = await supabaseAdmin
    .from("excel_import_logs")
    .select("*")
    .order("imported_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}
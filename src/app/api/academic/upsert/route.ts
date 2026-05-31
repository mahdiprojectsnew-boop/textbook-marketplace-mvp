import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const schema = z.object({
  university_id: z.string().uuid(),
  professor_raw: z.string().max(120).optional(),
  course_raw: z.string().max(200).optional(),
});

function normalizeName(s: string): string {
  return s
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function parseProfessorName(raw: string): { first: string; last: string } {
  const s = raw.trim();

  if (s.includes(",")) {
    const [last, ...rest] = s.split(",").map((p: string) => p.trim());
    return {
      first: normalizeName(rest.join(" ")),
      last: normalizeName(last),
    };
  }

  const parts = s.split(/\s+/);

  if (parts.length === 1) {
    return {
      first: "",
      last: normalizeName(s),
    };
  }

  return {
    first: normalizeName(parts.slice(0, -1).join(" ")),
    last: normalizeName(parts[parts.length - 1]),
  };
}

function parseCourse(raw: string): { code: string | null; name: string } {
  const s = raw.trim();
  const dashSplit = s.split(/\s*[—–:]\s*/);

  if (dashSplit.length >= 2) {
    const possibleCode = dashSplit[0].trim();

    if (possibleCode.length <= 15 && /^[A-Za-z0-9 ]+$/.test(possibleCode)) {
      return {
        code: possibleCode.toUpperCase().replace(/\s+/g, " "),
        name: dashSplit.slice(1).join(" — ").trim(),
      };
    }
  }

  const codeMatch = s.match(/^([A-Za-z]{2,8}\s*\d{2,4}[A-Za-z]?)\s+(.+)$/);

  if (codeMatch) {
    return {
      code: codeMatch[1].toUpperCase().replace(/\s+/g, " "),
      name: codeMatch[2].trim(),
    };
  }

  if (/^[A-Za-z]{2,8}\s*\d{2,4}[A-Za-z]?$/.test(s)) {
    return {
      code: s.toUpperCase().replace(/\s+/g, " "),
      name: s,
    };
  }

  return {
    code: null,
    name: s,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const { university_id, professor_raw, course_raw } = parsed.data;

  let professor_id: string | null = null;
  let course_id: string | null = null;

  if (professor_raw?.trim()) {
    const { first, last } = parseProfessorName(professor_raw);

    const { data: existing } = await supabase
      .from("professors")
      .select("id")
      .eq("university_id", university_id)
      .ilike("last_name", last)
      .ilike("first_name", first || "%")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();

    if (existing) {
      professor_id = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("professors")
        .insert({
          first_name: first || "—",
          last_name: last,
          university_id,
          is_active: true,
          source: "user_suggestion",
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to create professor" },
          { status: 500 }
        );
      }

      professor_id = created.id;
    }
  }

  if (course_raw?.trim()) {
    const { code, name } = parseCourse(course_raw);

    let q = supabase
      .from("courses")
      .select("id")
      .eq("university_id", university_id)
      .eq("is_active", true);

    if (code) {
      q = q.ilike("code", code);
    } else {
      q = q.ilike("name", name.trim());
    }

    const { data: existingCourse } = await q.limit(1).maybeSingle();

    if (existingCourse) {
      course_id = existingCourse.id;
    } else {
      const { data: createdCourse, error } = await supabase
        .from("courses")
        .insert({
          name: name.trim(),
          code: code ?? null,
          university_id,
          is_active: true,
          source: "user_suggestion",
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to create course" },
          { status: 500 }
        );
      }

      course_id = createdCourse.id;
    }
  }

  return NextResponse.json({
    professor_id,
    course_id,
  });
}
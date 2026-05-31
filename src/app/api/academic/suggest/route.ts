import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/academic/suggest?type=professor&university_id=xxx&q=smith
// GET /api/academic/suggest?type=course&university_id=xxx&q=bio
export async function GET(request: NextRequest) {
  const sp    = request.nextUrl.searchParams;
  const type  = sp.get("type");          // "professor" | "course"
  const uniId = sp.get("university_id");
  const q     = sp.get("q")?.trim() ?? "";

  if (!type || !uniId) return NextResponse.json({ results: [] });

  const supabase = await createClient();

  if (type === "professor") {
    let query = supabase
      .from("professors")
      .select("id, first_name, last_name")
      .eq("university_id", uniId)
      .eq("is_active", true)
      .order("last_name")
      .limit(20);

    if (q) {
      // ilike on last_name OR first_name
      query = query.or(`last_name.ilike.%${q}%,first_name.ilike.%${q}%`);
    }

    const { data } = await query;
    const results = (data ?? []).map(p => ({
      id:    p.id,
      label: `${p.last_name}, ${p.first_name}`,
    }));
    return NextResponse.json({ results });
  }

  if (type === "course") {
    let query = supabase
      .from("courses")
      .select("id, name, code")
      .eq("university_id", uniId)
      .eq("is_active", true)
      .order("name")
      .limit(20);

    if (q) {
      query = query.or(`name.ilike.%${q}%,code.ilike.%${q}%`);
    }

    const { data } = await query;
    const results = (data ?? []).map(c => ({
      id:       c.id,
      label:    c.code ? `${c.code} — ${c.name}` : c.name,
      sublabel: c.code ? c.name : undefined,
    }));
    return NextResponse.json({ results });
  }

  return NextResponse.json({ results: [] });
}

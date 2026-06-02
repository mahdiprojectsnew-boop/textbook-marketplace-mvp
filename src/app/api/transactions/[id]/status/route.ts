import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await request.json();

  if (!["accepted", "declined"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("transactions")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("seller_id", user.id)
    .select("id, status")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      {
        error: "Update failed",
        details: updateError?.message ?? "No row was updated",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    transaction: updated,
  });
}
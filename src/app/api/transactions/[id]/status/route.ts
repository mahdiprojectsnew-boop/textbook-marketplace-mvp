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

  const newStatus =
    status === "accepted"
      ? "active"
      : status === "declined"
      ? "cancelled"
      : null;

  if (!newStatus) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("transactions")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("seller_id", user.id)
    .select("id, status, seller_id, buyer_id");

  if (updateError) {
    return NextResponse.json(
      {
        error: "Update failed",
        details: updateError.message,
      },
      { status: 500 }
    );
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      {
        error: "No transaction updated",
        user_id: user.id,
        transaction_id: id,
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    transaction: updated,
  });
}
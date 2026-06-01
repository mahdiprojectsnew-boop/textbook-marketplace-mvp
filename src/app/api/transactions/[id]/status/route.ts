import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PATCH /api/transactions/[id]/status
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

  const { data: transaction, error: findError } = await supabase
    .from("transactions")
    .select("id, seller_id, listing_id, transaction_type")
    .eq("id", id)
    .eq("seller_id", user.id)
    .single();

  if (findError || !transaction) {
    return NextResponse.json(
      { error: "Transaction not found or not allowed" },
      { status: 404 }
    );
  }

  const { error: updateError } = await supabase
    .from("transactions")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("seller_id", user.id);

  if (updateError) {
    console.error("UPDATE TRANSACTION STATUS ERROR:", updateError);

    return NextResponse.json(
      {
        error: "Failed to update transaction",
        details: updateError.message,
        code: updateError.code,
      },
      { status: 500 }
    );
  }

  if (status === "accepted") {
    await supabase
      .from("listings")
      .update({
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.listing_id)
      .eq("seller_id", user.id);
  }

  return NextResponse.json({
    success: true,
    status,
  });
}
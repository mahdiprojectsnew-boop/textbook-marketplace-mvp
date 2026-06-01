import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/conversations
// Creates or returns existing conversation for a listing+buyer pair,
// then creates a rental transaction request and seller notification.
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { listing_id } = await request.json();

  if (!listing_id) {
    return NextResponse.json(
      { error: "listing_id required" },
      { status: 400 }
    );
  }

  const { data: listing, error: listingError } = await supabase
    .from("listings")
    .select("id, seller_id, listing_type, price, deposit_amount")
    .eq("id", listing_id)
    .eq("status", "active")
    .single();

  if (listingError || !listing) {
    return NextResponse.json(
      { error: "Listing not found" },
      { status: 404 }
    );
  }

  if (listing.seller_id === user.id) {
    return NextResponse.json(
      { error: "Cannot message your own listing" },
      { status: 400 }
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listing_id)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("FIND CONVERSATION ERROR:", existingError);

    return NextResponse.json(
      {
        error: "Failed to check existing conversation",
        details: existingError.message,
      },
      { status: 500 }
    );
  }

  let conversationId: string;

  if (existing) {
    conversationId = existing.id;
  } else {
    const { data: created, error: createConversationError } = await supabase
      .from("conversations")
      .insert({
        listing_id,
        buyer_id: user.id,
        seller_id: listing.seller_id,
      })
      .select("id")
      .single();

    if (createConversationError || !created) {
      console.error("CREATE CONVERSATION ERROR:", createConversationError);

      return NextResponse.json(
        {
          error: "Failed to create conversation",
          details: createConversationError?.message,
        },
        { status: 500 }
      );
    }

    conversationId = created.id;
  }

  const transactionType =
    listing.listing_type === "sale" ? "purchase" : "rental";

  const { error: transactionError } = await supabase
    .from("transactions")
    .insert({
      listing_id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      transaction_type: transactionType,
      status: "pending",
      amount: listing.price ?? null,
      deposit_amount: listing.deposit_amount ?? null,
    });

  if (transactionError) {
    console.error("TRANSACTION ERROR:", transactionError);

    return NextResponse.json(
      {
        error: "Failed to create transaction",
        details: transactionError.message,
        code: transactionError.code,
      },
      { status: 500 }
    );
  }

  
  return NextResponse.json({
    conversation_id: conversationId,
  });
}
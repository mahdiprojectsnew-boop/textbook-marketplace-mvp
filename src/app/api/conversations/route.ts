import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/conversations
// Creates or returns existing conversation for a listing+buyer pair
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listing_id } = await request.json();
  if (!listing_id) return NextResponse.json({ error: "listing_id required" }, { status: 400 });

  // Fetch listing to get seller_id
  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id")
    .eq("id", listing_id)
    .eq("status", "active")
    .single();

  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: "Cannot message your own listing" }, { status: 400 });
  }

  // Upsert: return existing conversation or create new one
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("listing_id", listing_id)
    .eq("buyer_id", user.id)
    .single();

  if (existing) return NextResponse.json({ conversation_id: existing.id });

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({ listing_id, buyer_id: user.id, seller_id: listing.seller_id })
    .select("id")
    .single();

  if (error || !created) {
  console.error("CREATE CONVERSATION ERROR:", error);
  console.error("CREATE CONVERSATION DATA:", {
    listing_id,
    buyer_id: user.id,
    seller_id: listing.seller_id,
  });

  return NextResponse.json(
    {
      error: "Failed to create conversation",
      details: error?.message,
      code: error?.code,
    },
    { status: 500 }
  );
}
  return NextResponse.json({ conversation_id: created.id });
}

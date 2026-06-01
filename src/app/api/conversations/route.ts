// Check if conversation already exists
const { data: existing } = await supabase
  .from("conversations")
  .select("id")
  .eq("listing_id", listing_id)
  .eq("buyer_id", user.id)
  .maybeSingle();

let conversationId: string;

// Existing conversation
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
    console.error(
      "CREATE CONVERSATION ERROR:",
      createConversationError
    );

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

// Create transaction
const { error: transactionError } = await supabase
  .from("transactions")
  .insert({
    listing_id,
    buyer_id: user.id,
    seller_id: listing.seller_id,
    transaction_type: "rental",
    status: "pending",
  });

if (transactionError) {
  console.error(
    "TRANSACTION ERROR:",
    JSON.stringify(transactionError, null, 2)
  );
}

// Create notification
const { error: notificationError } = await supabase
  .from("notifications")
  .insert({
    user_id: listing.seller_id,
    type: "rental_request",
    title: "New Rental Request",
    body: `New rental request received.`,
  });

if (notificationError) {
  console.error(
    "NOTIFICATION ERROR:",
    JSON.stringify(notificationError, null, 2)
  );
}

return NextResponse.json({
  conversation_id: conversationId,
});
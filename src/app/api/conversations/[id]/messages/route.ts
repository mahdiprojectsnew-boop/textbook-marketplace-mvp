import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/conversations/[id]/messages
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversation_id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { body } = await request.json();

  if (!body?.trim()) {
    return NextResponse.json(
      { error: "Message body required" },
      { status: 400 }
    );
  }

  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversation_id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (convoError || !convo) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const { data: message, error: messageError } = await supabase
    .from("conversation_messages")
    .insert({
      conversation_id,
      sender_id: user.id,
      body: body.trim(),
    })
    .select("id, body, sender_id, created_at, read_at")
    .single();

  if (messageError || !message) {
    console.error("SEND MESSAGE ERROR:", messageError);

    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }

  const { error: updateConversationError } = await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversation_id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

  if (updateConversationError) {
    console.error("UPDATE CONVERSATION ERROR:", updateConversationError);
  }

  return NextResponse.json({ message });
}

// PATCH /api/conversations/[id]/messages
// Mark all received messages in this conversation as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversation_id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: convo, error: convoError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversation_id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (convoError || !convo) {
    return NextResponse.json(
      { error: "Conversation not found" },
      { status: 404 }
    );
  }

  const { error: readError } = await supabase
    .from("conversation_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversation_id)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (readError) {
    console.error("MARK READ ERROR:", readError);

    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
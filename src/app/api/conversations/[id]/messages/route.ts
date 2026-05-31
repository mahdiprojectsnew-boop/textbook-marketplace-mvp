import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/conversations/[id]/messages
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversation_id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body } = await request.json();
  if (!body?.trim()) return NextResponse.json({ error: "Message body required" }, { status: 400 });

  // Verify user is a participant
  const { data: convo } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversation_id)
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (!convo) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });

  const { data: message, error } = await supabase
    .from("conversation_messages")
    .insert({ conversation_id, sender_id: user.id, body: body.trim() })
    .select("id, body, sender_id, created_at, read_at")
    .single();

  if (error || !message) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }

  return NextResponse.json({ message });
}

// PATCH /api/conversations/[id]/messages — mark all as read
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversation_id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await supabase
    .from("conversation_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversation_id)
    .neq("sender_id", user.id)
    .is("read_at", null);

  return NextResponse.json({ success: true });
}

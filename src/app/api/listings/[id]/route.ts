import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateSchema = z.object({
  listing_type:         z.enum(["sale", "rental"]).optional(),
  condition:            z.enum(["like_new", "very_good", "good", "fair", "poor"]).optional(),
  price:                z.number().positive().optional(),
  deposit_amount:       z.number().min(0).nullable().optional(),
  rental_duration_days: z.number().int().positive().nullable().optional(),
  description:          z.string().max(500).nullable().optional(),
  status:               z.enum(["active", "inactive"]).optional(),
  university_id:        z.string().uuid().nullable().optional(),
  professor_id:         z.string().uuid().nullable().optional(),
  course_id:            z.string().uuid().nullable().optional(),
});

// PATCH /api/listings/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // ── Auth ──────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse body FIRST (fixes temporal dead zone bug) ───────
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // ── Ownership check ───────────────────────────────────────
    const { data: listing, error: fetchErr } = await supabase
      .from("listings")
      .select("id, seller_id, status")
      .eq("id", id)
      .single();

    if (fetchErr || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    

    // Inactive listings can only receive status=active
    if (listing.status === "inactive" && !parsed.data.status) {
      return NextResponse.json(
        { error: "Cannot edit an inactive listing" },
        { status: 400 }
      );
    }

    // ── Database update ───────────────────────────────────────
    const { data: updated, error: updateErr } = await supabase
      .from("listings")
      .update(parsed.data)
      .eq("id", id)
      .eq("seller_id", user.id)
      .select("id, status")
      .single();

    if (updateErr || !updated) {
      return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }


    // Revalidate dashboard and listing pages so server cache is cleared
    revalidatePath("/dashboard");
    revalidatePath(`/listings/${id}`);

    return NextResponse.json({ success: true, status: updated.status });

  } catch (err) {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

// DELETE /api/listings/[id] — mark inactive (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: listing, error: fetchErr } = await supabase
      .from("listings")
      .select("id, seller_id")
      .eq("id", id)
      .single();

    if (fetchErr || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }
    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateErr } = await supabase
      .from("listings")
      .update({ status: "inactive" })
      .eq("id", id)
      .eq("seller_id", user.id);

    if (updateErr) {
      return NextResponse.json({ error: "Failed to deactivate listing" }, { status: 500 });
    }

    revalidatePath("/dashboard");
    revalidatePath(`/listings/${id}`);

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}

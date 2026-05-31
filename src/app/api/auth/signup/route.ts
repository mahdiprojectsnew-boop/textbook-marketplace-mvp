import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required").max(50),
  last_name: z.string().min(1, "Last name is required").max(50),
  role: z.enum(["student", "faculty", "admin"]),
});

function isEduEmail(email: string): boolean {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  return domain.endsWith(".edu");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, first_name, last_name, role } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createServiceClient();
console.log("SUPABASE_URL =", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log(
  "SERVICE_KEY_EXISTS =",
  !!process.env.SUPABASE_SERVICE_ROLE_KEY
);

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,
        email_confirm: true,
        user_metadata: {
          first_name,
          last_name,
          role,
        },
      });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create account. Please try again." },
        { status: 500 }
      );
    }

    const eduDetected = isEduEmail(normalizedEmail);
    const safeRole = role === "admin" ? "student" : role;

    const { error: profileError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: normalizedEmail,
      password_hash: "",
      first_name,
      last_name,
      role: safeRole,
      is_academic_verified: eduDetected,
      academic_email: eduDetected ? normalizedEmail : null,
      academic_verified_at: eduDetected ? new Date().toISOString() : null,
      is_active: true,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role: safeRole,
        is_academic_verified: eduDetected,
      },
      requires_confirmation: false,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Something went wrong. Please try again.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
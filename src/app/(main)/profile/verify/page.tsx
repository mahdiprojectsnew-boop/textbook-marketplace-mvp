import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  GraduationCap,
  Mail,
  ChevronLeft,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

async function verifyAcademicEmail(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const academicEmail = String(formData.get("academic_email") || "")
    .trim()
    .toLowerCase();

  if (!academicEmail || !academicEmail.endsWith(".edu")) {
    redirect("/profile/verify?error=invalid");
  }

  const { error } = await supabase
    .from("users")
    .update({
      academic_email: academicEmail,
      academic_verified: true,
      academic_verified_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("ACADEMIC VERIFY ERROR:", error);
    redirect("/profile/verify?error=save");
  }

  redirect("/profile/verify?success=1");
}

export default async function VerifyProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ success?: string; error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("academic_email, academic_verified")
    .eq("id", user.id)
    .single();

  const isVerified = profile?.academic_verified === true;

  return (
    <div
      className="min-h-screen bg-[#f8fafc]"
      style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
    >
      <div className="max-w-xl mx-auto px-5 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[#64748b] hover:text-[#0f172a] mb-6"
        >
          <ChevronLeft size={16} />
          Back to Dashboard
        </Link>

        <div className="bg-white border border-[#e5e7eb] rounded-2xl p-8 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-[#eff6ff] flex items-center justify-center mb-5">
            <GraduationCap size={24} className="text-[#1d4ed8]" />
          </div>

          <h1 className="text-2xl font-bold text-[#0f172a]">
            Academic Verification
          </h1>

          <p className="text-sm text-[#64748b] mt-3 leading-6">
            Academic verification helps students trust each other on Textbook
            Marketplace. For this MVP, users with a .edu email can receive the
            Academic Verified badge.
          </p>

          {params?.success === "1" && (
            <div className="mt-6 p-4 rounded-xl bg-green-50 border border-green-200 flex gap-3">
              <CheckCircle2 size={18} className="text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Academic email verified
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Your Academic Verified badge is now active.
                </p>
              </div>
            </div>
          )}

          {params?.error === "invalid" && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3">
              <AlertCircle size={18} className="text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Invalid academic email
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Please enter a valid university email ending in .edu.
                </p>
              </div>
            </div>
          )}

          {params?.error === "save" && (
            <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex gap-3">
              <AlertCircle size={18} className="text-red-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Could not save verification
                </p>
                <p className="text-sm text-red-700 mt-1">
                  Please try again.
                </p>
              </div>
            </div>
          )}

          {isVerified ? (
            <div className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-200">
              <p className="text-sm font-semibold text-blue-800">
                Verified Academic Email
              </p>
              <p className="text-sm text-blue-700 mt-1">
                {profile?.academic_email}
              </p>
            </div>
          ) : (
            <form action={verifyAcademicEmail} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#0f172a] mb-2">
                  University email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
                  />
                  <input
                    name="academic_email"
                    type="email"
                    required
                    placeholder="yourname@university.edu"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#e5e7eb] text-sm outline-none focus:ring-2 focus:ring-[#93c5fd] focus:border-[#60a5fa]"
                  />
                </div>
                <p className="text-xs text-[#94a3b8] mt-2">
                  MVP verification accepts emails ending in .edu.
                </p>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center px-5 py-3 rounded-xl bg-[#1d4ed8] text-white text-sm font-semibold hover:bg-[#1e40af] transition"
              >
                Verify Academic Email
              </button>
            </form>
          )}

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center mt-6 px-5 py-2.5 rounded-xl border border-[#e5e7eb] text-[#334155] text-sm font-semibold hover:bg-[#f8fafc] transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
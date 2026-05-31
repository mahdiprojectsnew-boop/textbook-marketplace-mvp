"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-8 h-8 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
            <BookOpen size={15} className="text-white" />
          </div>
          <span className="font-semibold text-[#0f172a]">Textbook Marketplace</span>
        </div>
        {sent ? (
          <div className="text-center">
            <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-[#0f172a] mb-2">Check your email</h1>
            <p className="text-sm text-[#64748b]">We sent a password reset link to <strong>{email}</strong>.</p>
            <Link href="/login" className="mt-6 inline-block text-sm text-[#1d4ed8] font-semibold hover:underline">← Back to login</Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-[#0f172a] mb-1">Reset your password</h1>
            <p className="text-sm text-[#64748b] mb-6">Enter your email and we'll send a reset link.</p>
            {error && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu"
                className="w-full px-4 py-2.5 rounded-lg border border-[#d1d5db] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition" />
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={15} className="animate-spin" />Sending…</> : "Send reset link"}
              </button>
            </form>
            <p className="mt-5 text-center text-sm text-[#6b7280]">
              <Link href="/login" className="text-[#1d4ed8] font-semibold hover:underline">← Back to login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

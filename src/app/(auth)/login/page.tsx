"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BookOpen, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { error: signInError } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (signInError) {
      setLoading(false);

      if (
        signInError.message.includes(
          "Invalid login credentials"
        )
      ) {
        setError(
          "Incorrect email or password. Please try again."
        );
      } else if (
        signInError.message.includes("Email not confirmed")
      ) {
        setError(
          "Please verify your email before logging in. Check your inbox."
        );
      } else {
        setError(signInError.message);
      }

      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <div
      className="min-h-screen flex"
      style={{
        fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      }}
    >
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 bg-[#0f1f3d] text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,.15) 40px, rgba(255,255,255,.15) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,.15) 40px, rgba(255,255,255,.15) 41px)",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#3b82f6] flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              Textbook Marketplace
            </span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-snug">
            The smarter way to
            <br />
            <span className="text-[#60a5fa]">
              find your textbooks.
            </span>
          </h2>

          <p className="text-[#94a3b8] text-sm leading-relaxed max-w-xs">
            Search by professor, course, and university.
            Buy, sell, and rent textbooks from students
            at your school.
          </p>

          <div className="flex gap-3 flex-wrap">
            {[
              "50+ Universities",
              "Student Verified",
              "Secure Payments",
            ].map((t) => (
              <span
                key={t}
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-[#cbd5e1] font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <p className="relative text-[#475569] text-xs">
          © {new Date().getFullYear()} Textbook Marketplace
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
              <BookOpen size={15} className="text-white" />
            </div>

            <span className="font-semibold text-[#0f172a]">
              Textbook Marketplace
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-[1.65rem] font-bold text-[#0f172a] tracking-tight">
              Welcome back
            </h1>

            <p className="text-[#64748b] mt-1 text-sm">
              Sign in to your account to continue.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle
                size={16}
                className="mt-0.5 shrink-0"
              />
              <span>{error}</span>
            </div>
          )}

          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                Email address
              </label>

              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="you@university.edu"
                className="w-full px-4 py-2.5 rounded-lg border border-[#d1d5db] bg-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide">
                  Password
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs text-[#3b82f6] hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[#d1d5db] bg-white"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-[#1d4ed8] text-white rounded-lg"
            >
              {loading ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin inline mr-2"
                  />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b7280]">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="text-[#1d4ed8] font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
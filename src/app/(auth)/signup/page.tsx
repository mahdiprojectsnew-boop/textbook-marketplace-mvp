"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, GraduationCap, Users, ShieldCheck } from "lucide-react";

type Role = "student" | "faculty" | "admin";

const ROLES: { value: Role; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "student",
    label: "Student",
    description: "Looking for textbooks for my courses",
    icon: <GraduationCap size={18} />,
  },
  {
    value: "faculty",
    label: "Faculty",
    description: "Professor or instructor at a university",
    icon: <Users size={18} />,
  },
  {
    value: "admin",
    label: "Admin",
    description: "Platform administrator",
    icon: <ShieldCheck size={18} />,
  },
];

function isEduEmail(email: string) {
  return email.split("@")[1]?.toLowerCase().endsWith(".edu") ?? false;
}

function getPasswordStrength(p: string): { score: number; label: string; color: string } {
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  if (score <= 1) return { score, label: "Weak", color: "#ef4444" };
  if (score <= 3) return { score, label: "Fair", color: "#f59e0b" };
  return { score, label: "Strong", color: "#22c55e" };
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const eduDetected = isEduEmail(email);
  const pwStrength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      if (data.requires_confirmation) {
        setSuccess(true);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-6">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-[#0f172a] mb-2">Check your email</h1>
          <p className="text-[#64748b] text-sm leading-relaxed">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-[#0f172a]">{email}</span>.
            Click it to activate your account and log in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block text-sm text-[#1d4ed8] font-semibold hover:underline"
          >
            ← Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-12 bg-[#0f1f3d] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,.15) 40px, rgba(255,255,255,.15) 41px),
              repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,.15) 40px, rgba(255,255,255,.15) 41px)`
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#3b82f6] flex items-center justify-center">
            <BookOpen size={18} className="text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">Textbook Marketplace</span>
        </div>
        <div className="relative space-y-5">
          <h2 className="text-3xl font-bold leading-snug">
            Join thousands of<br />
            <span className="text-[#60a5fa]">students saving money.</span>
          </h2>
          <ul className="space-y-3 text-sm text-[#94a3b8]">
            {[
              "Find books by professor & course",
              "Save up to 80% vs. campus bookstore",
              "Rent for a semester, return when done",
              "Verified student community",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5">
                <CheckCircle2 size={14} className="text-[#34d399] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[#475569] text-xs">
          © {new Date().getFullYear()} Textbook Marketplace
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-[#f8fafc]">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
              <BookOpen size={15} className="text-white" />
            </div>
            <span className="font-semibold text-[#0f172a]">Textbook Marketplace</span>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  s <= step ? "bg-[#1d4ed8] text-white" : "bg-[#e2e8f0] text-[#94a3b8]"
                }`}>
                  {s < step ? "✓" : s}
                </div>
                <span className={`text-xs font-medium ${s === step ? "text-[#1d4ed8]" : "text-[#94a3b8]"}`}>
                  {s === 1 ? "Your role" : "Your details"}
                </span>
                {s < 2 && <div className="w-8 h-px bg-[#e2e8f0]" />}
              </div>
            ))}
          </div>

          <div className="mb-7">
            <h1 className="text-[1.65rem] font-bold text-[#0f172a] tracking-tight">
              {step === 1 ? "I am a…" : "Create your account"}
            </h1>
            <p className="text-[#64748b] mt-1 text-sm">
              {step === 1
                ? "Tell us who you are so we can personalize your experience."
                : "Fill in your details to get started."}
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1 — Role selection */}
          {step === 1 && (
            <div className="space-y-3">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border-2 text-left transition-all ${
                    role === r.value
                      ? "border-[#1d4ed8] bg-[#eff6ff]"
                      : "border-[#e5e7eb] bg-white hover:border-[#93c5fd]"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    role === r.value ? "bg-[#1d4ed8] text-white" : "bg-[#f1f5f9] text-[#64748b]"
                  }`}>
                    {r.icon}
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${role === r.value ? "text-[#1d4ed8]" : "text-[#111827]"}`}>
                      {r.label}
                    </p>
                    <p className="text-xs text-[#6b7280] mt-0.5">{r.description}</p>
                  </div>
                  <div className={`ml-auto w-4 h-4 rounded-full border-2 shrink-0 ${
                    role === r.value ? "border-[#1d4ed8] bg-[#1d4ed8]" : "border-[#d1d5db]"
                  }`}>
                    {role === r.value && (
                      <div className="w-full h-full rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                </button>
              ))}

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full mt-2 py-2.5 px-4 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition"
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                    First name
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Alex"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] bg-white text-[#111827] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                    Last name
                  </label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Johnson"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] bg-white text-[#111827] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                  Email address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@university.edu"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] bg-white text-[#111827] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition"
                  />
                </div>
                {/* .edu detection badge */}
                {email.includes("@") && (
                  <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${eduDetected ? "text-green-600" : "text-[#94a3b8]"}`}>
                    <CheckCircle2 size={12} className={eduDetected ? "text-green-500" : "text-[#cbd5e1]"} />
                    {eduDetected
                      ? "Academic Verified badge will be applied automatically"
                      : "Use your .edu email to get an Academic Verified badge"}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-[#d1d5db] bg-white text-[#111827] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151]"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {/* Password strength */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-colors"
                          style={{
                            backgroundColor: i <= pwStrength.score ? pwStrength.color : "#e5e7eb",
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-xs" style={{ color: pwStrength.color }}>
                      {pwStrength.label} password
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 rounded-lg border border-[#d1d5db] text-sm text-[#374151] font-medium hover:bg-[#f9fafb] transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || password.length < 8}
                  className="flex-1 py-2.5 px-4 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </div>

              <p className="text-[10px] text-[#9ca3af] text-center leading-relaxed">
                By creating an account you agree to our{" "}
                <Link href="/terms" className="underline hover:text-[#374151]">Terms of Service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="underline hover:text-[#374151]">Privacy Policy</Link>.
              </p>
            </form>
          )}

          {step === 1 && (
            <p className="mt-5 text-center text-sm text-[#6b7280]">
              Already have an account?{" "}
              <Link href="/login" className="text-[#1d4ed8] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

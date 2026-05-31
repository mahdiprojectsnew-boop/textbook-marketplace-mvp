import Link from "next/link";
import { GraduationCap, Mail, ChevronLeft } from "lucide-react";

export default function VerifyProfilePage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
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
            Academic verification helps students trust each other on Textbook Marketplace.
            For this MVP, users with a verified .edu email can receive the Academic Verified badge.
          </p>

          <div className="mt-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-3">
              <Mail size={18} className="text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Coming soon
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  Soon you will be able to add and verify your university email address here.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center mt-6 px-5 py-2.5 rounded-xl bg-[#1d4ed8] text-white text-sm font-semibold hover:bg-[#1e40af] transition"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
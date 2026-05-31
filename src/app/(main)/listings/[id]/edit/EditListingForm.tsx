"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  ChevronDown,
  Trash2,
} from "lucide-react";
import {
  AcademicSection,
  type AcademicValue,
} from "@/components/academic/AcademicSection";

type Condition = "like_new" | "very_good" | "good" | "fair" | "poor";
type ListingType = "sale" | "rental";

interface InitialData {
  listing_type: ListingType;
  condition: Condition;
  price: number;
  deposit_amount: number | null;
  rental_duration_days: number | null;
  description: string;
  university_id: string | null;
  professor_id: string | null;
  professor_label: string | null;
  course_id: string | null;
  course_label: string | null;
}

interface Props {
  listingId: string;
  initialData: InitialData;
}

const CONDITIONS: { value: Condition; label: string; desc: string }[] = [
  { value: "like_new", label: "Like New", desc: "No markings, perfect condition" },
  { value: "very_good", label: "Very Good", desc: "Minor wear, no markings" },
  { value: "good", label: "Good", desc: "Some wear or light highlighting" },
  { value: "fair", label: "Fair", desc: "Heavy use, still readable" },
  { value: "poor", label: "Poor", desc: "Significant damage but usable" },
];

const RENTAL_DURATIONS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days (1 semester)" },
  { value: "120", label: "120 days" },
  { value: "180", label: "180 days (2 semesters)" },
];

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] bg-white text-[#111827] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition disabled:bg-[#f9fafb]";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[#f1f5f9]">
        <h2 className="text-sm font-bold text-[#0f172a]">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
      {children}
    </label>
  );
}

export function EditListingForm({ listingId, initialData }: Props) {
  const router = useRouter();

  const [listingType, setListingType] = useState<ListingType>(
    initialData.listing_type
  );
  const [condition, setCondition] = useState<Condition>(initialData.condition);
  const [price, setPrice] = useState(String(initialData.price));
  const [deposit, setDeposit] = useState(
    String(initialData.deposit_amount ?? "")
  );
  const [duration, setDuration] = useState(
    String(initialData.rental_duration_days ?? "90")
  );
  const [description, setDescription] = useState(initialData.description);

  const [academic, setAcademic] = useState<AcademicValue>({
    universityId: initialData.university_id ?? "",
    professorId: initialData.professor_id ?? "",
    professorText: "",
    courseId: initialData.course_id ?? "",
    courseText: "",
  });

  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSaving(true);

    try {
      let resolvedProfessorId = academic.professorId || null;
      let resolvedCourseId = academic.courseId || null;

      if (academic.universityId && (academic.professorText || academic.courseText)) {
        const upsertRes = await fetch("/api/academic/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            university_id: academic.universityId,
            professor_raw: academic.professorText || undefined,
            course_raw: academic.courseText || undefined,
          }),
        });

        const upsertData = await upsertRes.json();

        if (!upsertRes.ok) {
          throw new Error(upsertData.error ?? "Failed to save academic data.");
        }

        if (upsertData.professor_id) {
          resolvedProfessorId = upsertData.professor_id;
        }

        if (upsertData.course_id) {
          resolvedCourseId = upsertData.course_id;
        }
      }

      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_type: listingType,
          condition,
          price: parseFloat(price),
          deposit_amount:
            listingType === "rental" && deposit ? parseFloat(deposit) : null,
          rental_duration_days:
            listingType === "rental" ? parseInt(duration) : null,
          description: description.trim() || null,
          university_id: academic.universityId || null,
          professor_id: resolvedProfessorId,
          course_id: resolvedCourseId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Update failed.");
        return;
      }

      router.push(`/listings/${listingId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (deactivating) return;

    setError("");
    setDeactivating(true);

    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "inactive",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to deactivate.");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-5">
      {error && (
        <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <Section title="Listing Type">
        <div className="grid grid-cols-2 gap-3">
          {(["sale", "rental"] as ListingType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setListingType(t)}
              className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                listingType === t
                  ? "border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]"
                  : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#93c5fd]"
              }`}
            >
              {t === "sale" ? "📦 For Sale" : "🔄 For Rent"}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Book Condition">
        <div className="space-y-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCondition(c.value)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 text-left transition ${
                condition === c.value
                  ? "border-[#1d4ed8] bg-[#eff6ff]"
                  : "border-[#e5e7eb] bg-white hover:border-[#93c5fd]"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  condition === c.value
                    ? "border-[#1d4ed8]"
                    : "border-[#d1d5db]"
                }`}
              >
                {condition === c.value && (
                  <div className="w-2 h-2 rounded-full bg-[#1d4ed8]" />
                )}
              </div>

              <span
                className={`text-sm font-semibold ${
                  condition === c.value ? "text-[#1d4ed8]" : "text-[#111827]"
                }`}
              >
                {c.label}
              </span>

              <span className="text-xs text-[#6b7280] ml-1">{c.desc}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title={listingType === "sale" ? "Pricing" : "Pricing & Deposit"}>
        <div className={listingType === "rental" ? "grid grid-cols-2 gap-3" : ""}>
          <div>
            <Label>{listingType === "sale" ? "Asking Price" : "Rental Price"} *</Label>
            <div className="relative">
              <DollarSign
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
              />
              <input
                type="number"
                required
                min="1"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls + " pl-8"}
              />
            </div>
          </div>

          {listingType === "rental" && (
            <div>
              <Label>Deposit Amount</Label>
              <div className="relative">
                <DollarSign
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={deposit}
                  onChange={(e) => setDeposit(e.target.value)}
                  className={inputCls + " pl-8"}
                />
              </div>
            </div>
          )}
        </div>

        {listingType === "rental" && (
          <div>
            <Label>Rental Duration</Label>
            <div className="relative">
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputCls + " appearance-none pr-8 cursor-pointer"}
              >
                {RENTAL_DURATIONS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 p-3 bg-[#f0f9ff] border border-[#bae6fd] rounded-lg text-xs text-[#0369a1]">
          <Info size={13} className="mt-0.5 shrink-0" />
          Platform fee of 4% applies to all transactions at checkout.
        </div>
      </Section>

      <Section title="Academic Context">
        <AcademicSection value={academic} onChange={setAcademic} />
      </Section>

      <Section title="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          maxLength={500}
          placeholder="Optional notes — condition details, included materials, etc."
          className={inputCls + " resize-none"}
        />

        <p className="text-xs text-[#94a3b8]">{description.length}/500</p>
      </Section>

      <div className="bg-white rounded-xl border border-[#fecaca] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#fee2e2]">
          <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
        </div>

        <div className="p-5">
          <p className="text-sm text-[#64748b] mb-4">
            Marking this listing as inactive removes it from browse results.
          </p>

          {!showConfirm ? (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-semibold hover:bg-red-50 transition"
            >
              <Trash2 size={14} />
              Mark as Inactive
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-red-700">
                Are you sure? This listing will no longer appear in search results.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDeactivate}
                  disabled={deactivating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition disabled:opacity-60"
                >
                  {deactivating ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Deactivating…
                    </>
                  ) : (
                    "Yes, mark inactive"
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm text-[#374151] font-medium hover:bg-[#f8fafc] transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 -mx-5 px-5 py-4 bg-white border-t border-[#e5e7eb] flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-lg border border-[#e5e7eb] text-sm text-[#374151] font-medium hover:bg-[#f8fafc] transition"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving || !price}
          className="flex-1 sm:flex-none sm:min-w-[140px] py-2.5 px-6 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 size={14} />
              Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { uploadListingImages, validateImageFile } from "@/lib/supabase/storage";
import {
  AcademicSection,
  type AcademicValue,
} from "@/components/academic/AcademicSection";
import {
  BookOpen,
  ChevronLeft,
  Upload,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  DollarSign,
  Hash,
  Info,
  ChevronDown,
} from "lucide-react";

type Condition = "like_new" | "very_good" | "good" | "fair" | "poor";
type ListingType = "sale" | "rental";

const CONDITIONS: { value: Condition; label: string; desc: string }[] = [
  { value: "like_new", label: "Like New", desc: "No markings, perfect condition" },
  { value: "very_good", label: "Very Good", desc: "Minor wear, no markings" },
  { value: "good", label: "Good", desc: "Some wear or light highlighting" },
  { value: "fair", label: "Fair", desc: "Heavy use, still readable" },
  { value: "poor", label: "Poor", desc: "Significant damage but usable" },
];

const DEPOSIT_MULTIPLIER: Record<Condition, number> = {
  like_new: 1.0,
  very_good: 0.85,
  good: 0.7,
  fair: 0.5,
  poor: 0.35,
};

const RENTAL_DURATIONS = [
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days (1 semester)" },
  { value: "120", label: "120 days" },
  { value: "180", label: "180 days (2 semesters)" },
];

const inputCls =
  "w-full px-3 py-2.5 rounded-lg border border-[#d1d5db] bg-white text-[#111827] text-sm placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition disabled:bg-[#f9fafb] disabled:text-[#9ca3af]";

const selectCls = inputCls + " appearance-none pr-8 cursor-pointer";

function Label({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function Field({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-[#94a3b8]">{hint}</p>}
    </div>
  );
}

function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select className={selectCls} {...props}>
        {children}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none"
      />
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#f1f5f9]">
        <h2 className="text-sm font-bold text-[#0f172a]">{title}</h2>
        {subtitle && (
          <p className="text-xs text-[#64748b] mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

export default function NewListingPage() {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [academic, setAcademic] = useState<AcademicValue>({
    universityId: "",
    professorId: "",
    professorText: "",
    courseId: "",
    courseText: "",
  });

  const [listingType, setListingType] = useState<ListingType>("sale");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [edition, setEdition] = useState("");
  const [condition, setCondition] = useState<Condition>("good");
  const [price, setPrice] = useState("");
  const [deposit, setDeposit] = useState("");
  const [duration, setDuration] = useState("90");
  const [description, setDescription] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, [supabase]);

  useEffect(() => {
    if (listingType === "rental" && price) {
      const suggested = (
        parseFloat(price) * DEPOSIT_MULTIPLIER[condition]
      ).toFixed(2);
      setDeposit(suggested);
    }
  }, [condition, price, listingType]);

  function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const remaining = 5 - images.length;
    const validFiles: File[] = [];
    const validationErrors: string[] = [];

    for (const file of files.slice(0, remaining)) {
      const err = validateImageFile(file);

      if (err) {
        validationErrors.push(err);
        continue;
      }

      validFiles.push(file);
    }

    if (validationErrors.length > 0) {
      setError(validationErrors[0]);
    }

    setImages((prev) => [...prev, ...validFiles]);

    validFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        setPreviews((prev) => [
          ...prev,
          event.target?.result as string,
        ]);
      };

      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!userId) {
      setError("You must be logged in to list a book.");
      return;
    }

    if (images.length < 1) {
      setError("Please upload at least one photo of the book.");
      return;
    }

    setSubmitting(true);

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

      let bookId: string;

      if (isbn.trim()) {
        const { data: existing } = await supabase
          .from("books")
          .select("id")
          .eq("isbn", isbn.trim())
          .maybeSingle();

        if (existing) {
          bookId = existing.id;
        } else {
          const { data: newBook, error: bookError } = await supabase
            .from("books")
            .insert({
              title: title.trim(),
              author: author.trim() || null,
              isbn: isbn.trim() || null,
              edition: edition.trim() || null,
              is_active: true,
              source: "user_suggestion",
            })
            .select("id")
            .single();

          if (bookError || !newBook) {
            throw new Error("Failed to save book details.");
          }

          bookId = newBook.id;
        }
      } else {
        const { data: newBook, error: bookError } = await supabase
          .from("books")
          .insert({
            title: title.trim(),
            author: author.trim() || null,
            isbn: null,
            edition: edition.trim() || null,
            is_active: true,
            source: "user_suggestion",
          })
          .select("id")
          .single();

        if (bookError || !newBook) {
          throw new Error("Failed to save book details.");
        }

        bookId = newBook.id;
      }

      const listingPayload: Record<string, unknown> = {
        seller_id: userId,
        book_id: bookId,
        listing_type: listingType,
        condition,
        price: parseFloat(price),
        description: description.trim() || null,
        status: "active",
        university_id: academic.universityId || null,
        professor_id: resolvedProfessorId,
        course_id: resolvedCourseId,
      };

      if (listingType === "rental") {
        listingPayload.deposit_amount = parseFloat(deposit) || null;
        listingPayload.rental_duration_days = parseInt(duration);
      }

      const { data: listing, error: listingError } = await supabase
        .from("listings")
        .insert(listingPayload)
        .select("id")
        .single();

      if (listingError || !listing) {
        throw new Error(listingError?.message ?? "Failed to create listing.");
      }

      const { uploaded, errors: uploadErrors } = await uploadListingImages(
        images,
        userId,
        listing.id
      );

      if (uploaded === 0 && uploadErrors.length > 0) {
        await supabase
          .from("listings")
          .update({ status: "inactive" })
          .eq("id", listing.id);

        throw new Error(`Image upload failed: ${uploadErrors[0]}`);
      }

      router.push("/dashboard?listed=1");
      router.refresh();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-[#f8fafc]"
      style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}
    >
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9] transition"
          >
            <ChevronLeft size={18} />
          </Link>

          <div className="w-px h-5 bg-[#e5e7eb]" />

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="font-bold text-[#0f172a] text-sm">
              List a Book
            </span>
          </div>
        </div>
      </header>

      <form onSubmit={handleSubmit}>
        <div className="max-w-3xl mx-auto px-5 py-7 space-y-5">
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">
              Create a Listing
            </h1>
            <p className="text-sm text-[#64748b] mt-0.5">
              Fill in the details below. Fields marked{" "}
              <span className="text-red-500">*</span> are required.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          <Section
            title="Listing Type"
            subtitle="Are you selling or renting this book?"
          >
            <div className="grid grid-cols-2 gap-3">
              {(["sale", "rental"] as ListingType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setListingType(type)}
                  className={`px-4 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                    listingType === type
                      ? "border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]"
                      : "border-[#e5e7eb] bg-white text-[#374151] hover:border-[#93c5fd]"
                  }`}
                >
                  {type === "sale" ? "📦 For Sale" : "🔄 For Rent"}
                </button>
              ))}
            </div>
          </Section>

          <Section title="Book Details" subtitle="Enter the textbook information.">
            <Field hint="Enter the full title as it appears on the cover.">
              <Label required>Book Title</Label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Campbell Biology"
                className={inputCls}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <Label>Author</Label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Jane B. Reece"
                  className={inputCls}
                />
              </Field>

              <Field>
                <Label>Edition</Label>
                <input
                  type="text"
                  value={edition}
                  onChange={(e) => setEdition(e.target.value)}
                  placeholder="e.g. 12th"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field hint="ISBN helps buyers find the exact edition. Check the back cover or copyright page.">
              <Label>ISBN</Label>
              <div className="relative">
                <Hash
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                />
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-0-13-409341-3"
                  className={inputCls + " pl-8"}
                />
              </div>
            </Field>
          </Section>

          <Section
            title="Book Condition"
            subtitle="Be honest — it builds trust and fewer disputes."
          >
            <div className="space-y-2">
              {CONDITIONS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setCondition(item.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition ${
                    condition === item.value
                      ? "border-[#1d4ed8] bg-[#eff6ff]"
                      : "border-[#e5e7eb] bg-white hover:border-[#93c5fd]"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      condition === item.value
                        ? "border-[#1d4ed8]"
                        : "border-[#d1d5db]"
                    }`}
                  >
                    {condition === item.value && (
                      <div className="w-2 h-2 rounded-full bg-[#1d4ed8]" />
                    )}
                  </div>

                  <div>
                    <span
                      className={`text-sm font-semibold ${
                        condition === item.value
                          ? "text-[#1d4ed8]"
                          : "text-[#111827]"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span className="text-xs text-[#6b7280] ml-2">
                      {item.desc}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          <Section
            title={listingType === "sale" ? "Pricing" : "Pricing & Deposit"}
            subtitle={
              listingType === "sale"
                ? "Set your asking price. A 4% platform fee applies at checkout."
                : "Set the rental fee and deposit. Deposit is refunded on successful return."
            }
          >
            <div
              className={
                listingType === "rental" ? "grid grid-cols-2 gap-3" : ""
              }
            >
              <Field
                hint={
                  listingType === "sale"
                    ? "Platform fee: 4% charged to buyer."
                    : "Rental fee charged at checkout."
                }
              >
                <Label required>
                  {listingType === "sale" ? "Asking Price" : "Rental Price"}
                </Label>
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
                    placeholder="0.00"
                    className={inputCls + " pl-8"}
                  />
                </div>
              </Field>

              {listingType === "rental" && (
                <Field hint="Auto-suggested from condition. You can adjust.">
                  <Label required>Deposit Amount</Label>
                  <div className="relative">
                    <DollarSign
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"
                    />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={deposit}
                      onChange={(e) => setDeposit(e.target.value)}
                      placeholder="0.00"
                      className={inputCls + " pl-8"}
                    />
                  </div>
                </Field>
              )}
            </div>

            {listingType === "rental" && (
              <Field hint="How long the renter can keep the book.">
                <Label required>Rental Duration</Label>
                <Select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  {RENTAL_DURATIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </Field>
            )}

            {listingType === "rental" && deposit && price && (
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-[#1d4ed8]">
                <Info size={13} className="mt-0.5 shrink-0" />
                <span>
                  Renter pays{" "}
                  <strong>${parseFloat(price || "0").toFixed(2)}</strong>{" "}
                  rental fee +{" "}
                  <strong>${parseFloat(deposit || "0").toFixed(2)}</strong>{" "}
                  deposit. Deposit is authorized as a hold and released on
                  return.
                </span>
              </div>
            )}
          </Section>

          <Section
            title="Academic Context"
            subtitle="Link this book to a professor and course so students can find it by searching."
          >
            <AcademicSection value={academic} onChange={setAcademic} />
          </Section>

          <Section
            title="Photos"
            subtitle="Upload clear photos of the actual book. Minimum 1 required, up to 5."
          >
            {previews.length > 0 && (
              <div className="grid grid-cols-5 gap-2">
                {previews.map((src, index) => (
                  <div
                    key={index}
                    className="relative aspect-square rounded-lg overflow-hidden border border-[#e5e7eb] group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                    >
                      <X size={10} className="text-white" />
                    </button>

                    {index === 0 && (
                      <span className="absolute bottom-0 left-0 right-0 text-[9px] font-semibold text-center bg-[#1d4ed8]/80 text-white py-0.5">
                        Cover
                      </span>
                    )}
                  </div>
                ))}

                {images.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-lg border-2 border-dashed border-[#d1d5db] flex flex-col items-center justify-center gap-1 hover:border-[#3b82f6] hover:bg-[#eff6ff] transition"
                  >
                    <Upload size={16} className="text-[#94a3b8]" />
                    <span className="text-[10px] text-[#94a3b8] font-medium">
                      Add
                    </span>
                  </button>
                )}
              </div>
            )}

            {images.length === 0 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[#d1d5db] rounded-xl py-10 flex flex-col items-center gap-2 hover:border-[#3b82f6] hover:bg-[#f8faff] transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-[#eff6ff] flex items-center justify-center group-hover:bg-[#dbeafe] transition">
                  <Upload size={18} className="text-[#1d4ed8]" />
                </div>

                <div className="text-center">
                  <p className="text-sm font-semibold text-[#374151]">
                    Upload photos
                  </p>
                  <p className="text-xs text-[#94a3b8] mt-0.5">
                    JPG, PNG up to 10 MB each · up to 5 photos
                  </p>
                </div>

                <span className="text-xs font-semibold text-[#1d4ed8] px-3 py-1 rounded-full bg-[#eff6ff]">
                  Choose files
                </span>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageAdd}
            />

            <div className="flex items-start gap-2 p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg text-xs text-green-700">
              <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
              Images upload directly to secure cloud storage. Max 5 MB per
              photo. JPG, PNG, WebP accepted.
            </div>
          </Section>

          <Section
            title="Description"
            subtitle="Optional notes for the buyer — condition details, included materials, etc."
          >
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="e.g. Minimal highlighting in chapters 1–3, no writing. All loose pages still intact. Access code unused."
              className={inputCls + " resize-none"}
            />
            <p className="text-xs text-[#94a3b8]">
              {description.length}/500 characters
            </p>
          </Section>

          <div className="sticky bottom-0 -mx-5 px-5 py-4 bg-white border-t border-[#e5e7eb] flex items-center justify-between gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-lg border border-[#e5e7eb] text-sm text-[#374151] font-medium hover:bg-[#f8fafc] transition"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting || !title || !price}
              className="flex-1 sm:flex-none sm:min-w-[160px] py-2.5 px-6 bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  Publish Listing
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
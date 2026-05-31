import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, BookOpen } from "lucide-react";
import { EditListingForm } from "./EditListingForm";

export default async function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/listings/${id}/edit`);

  const { data, error } = await supabase
    .from("listings")
    .select(`
      id, listing_type, condition, price, deposit_amount,
      rental_duration_days, description, status, seller_id,
      university_id, professor_id, course_id,
      books ( title, author, isbn, edition ),
      professors ( first_name, last_name ),
      courses ( name, code )
    `)
    .eq("id", id)
    .single();

  if (error || !data) notFound();
  if ((data as any).seller_id !== user.id) notFound(); // 404 instead of 403 to avoid info leak
  // Owner can edit active OR inactive listings — do not redirect on inactive

  const listing = data as any;

  return (
    <div className="min-h-screen bg-[#f8fafc]" style={{ fontFamily: "'DM Sans','Helvetica Neue',sans-serif" }}>
      <header className="bg-white border-b border-[#e5e7eb] sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-3">
          <Link href={`/listings/${id}`} className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition">
            <ChevronLeft size={18} />
          </Link>
          <div className="w-px h-5 bg-[#e5e7eb]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#1d4ed8] flex items-center justify-center">
              <BookOpen size={14} className="text-white" />
            </div>
            <span className="text-sm font-bold text-[#0f172a]">Edit Listing</span>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-7">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#0f172a]">
            {listing.books?.title ?? "Edit Listing"}
          </h1>
          {listing.books?.author && (
            <p className="text-sm text-[#64748b] mt-0.5">by {listing.books.author}</p>
          )}
        </div>

        <EditListingForm
          listingId={id}
          initialData={{
            listing_type:         listing.listing_type,
            condition:            listing.condition,
            price:                listing.price,
            deposit_amount:       listing.deposit_amount,
            rental_duration_days: listing.rental_duration_days,
            description:          listing.description ?? "",
            university_id:   listing.university_id   ?? null,
            professor_id:    listing.professor_id    ?? null,
            professor_label: listing.professors
              ? `${listing.professors.last_name}, ${listing.professors.first_name}`
              : null,
            course_id:       listing.course_id ?? null,
            course_label:    listing.courses
              ? (listing.courses.code ? `${listing.courses.code} — ${listing.courses.name}` : listing.courses.name)
              : null,
          }}
        />
      </div>
    </div>
  );
}

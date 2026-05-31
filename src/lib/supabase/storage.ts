import { createClient } from "@/lib/supabase/client";

export const BUCKET = "listing-images";
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export type ImageType = "front_cover" | "back_cover" | "interior" | "damage" | "other";
export const IMAGE_TYPE_SEQUENCE: ImageType[] = [
  "front_cover", "back_cover", "interior", "damage", "other",
];

export interface UploadedImage {
  storage_path: string;
  image_url: string;
  image_type: ImageType;
  sort_order: number;
}

/** Validate a file before upload. Returns error string or null. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `${file.name}: Only JPG, PNG, and WebP images are allowed.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: File exceeds 5 MB limit.`;
  }
  return null;
}

/** Upload a single image file to Supabase Storage.
 *  Returns the storage path and public URL. */
export async function uploadListingImage(
  file: File,
  userId: string,
  listingId: string,
  sortOrder: number
): Promise<{ storage_path: string; image_url: string }> {
  const supabase = createClient();

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storage_path = `${userId}/${listingId}/${Date.now()}-${sortOrder}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storage_path, file, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Upload failed for ${file.name}: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(storage_path);

  return { storage_path, image_url: urlData.publicUrl };
}

/** Upload all images for a listing and insert records into listing_images. */
export async function uploadListingImages(
  files: File[],
  userId: string,
  listingId: string
): Promise<{ uploaded: number; errors: string[] }> {
  const supabase = createClient();
  const errors: string[] = [];
  let uploaded = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    const validationError = validateImageFile(file);
    if (validationError) { errors.push(validationError); continue; }

    try {
      const { storage_path, image_url } = await uploadListingImage(file, userId, listingId, i);

      const { error: dbError } = await supabase.from("listing_images").insert({
        listing_id: listingId,
        s3_key:     storage_path,   // reusing s3_key column for storage path
        image_url,
        image_type: IMAGE_TYPE_SEQUENCE[i] ?? "other",
        sort_order: i,
      });

      if (dbError) {
        errors.push(`${file.name}: Failed to save image record — ${dbError.message}`);
        // Clean up the uploaded file to avoid orphans
        await supabase.storage.from(BUCKET).remove([storage_path]);
        continue;
      }

      uploaded++;
    } catch (err) {
      errors.push(err instanceof Error ? err.message : `${file.name}: Upload failed.`);
    }
  }

  return { uploaded, errors };
}

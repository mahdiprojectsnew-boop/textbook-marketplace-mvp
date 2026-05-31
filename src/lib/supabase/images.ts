/**
 * Image URL resolution utility for listing images.
 *
 * Supabase Storage saves full public URLs into image_url via getPublicUrl().
 * Old placeholder rows have image_url = "/placeholder-image.png".
 * This utility normalises both cases.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const BUCKET = "listing-images";

/**
 * Returns true if the URL is a real uploaded image (not a placeholder).
 */
export function isRealImage(url: string | null | undefined): boolean {
  if (!url) return false;
  if (url.startsWith("/placeholder")) return false;
  if (url.includes("placeholder-image")) return false;
  if (url.startsWith("/")) return false; // any local path is not a real upload
  return true;
}

/**
 * Given an image_url value from listing_images, returns a displayable URL.
 * - If it's already a full https:// URL → return as-is.
 * - If it looks like a storage path (no protocol) → build public URL.
 * - Otherwise → return null (caller shows fallback).
 */
export function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (!isRealImage(imageUrl)) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  // Storage path only — build public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${imageUrl}`;
}

/**
 * From an array of listing_images rows, returns the first real image URL
 * sorted by sort_order ASC, or null if none exist.
 */
export function getFirstImageUrl(
  images: Array<{ image_url: string; sort_order: number }> | null | undefined
): string | null {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  for (const img of sorted) {
    const url = resolveImageUrl(img.image_url);
    if (url) return url;
  }
  return null;
}

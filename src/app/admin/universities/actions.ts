"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

function createSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function addUniversity(formData: FormData) {
  const supabase = createServiceClient();

  const name = String(formData.get("name") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const state = String(formData.get("state") || "").trim().toUpperCase();
  const website = String(formData.get("website") || "").trim();

  if (!name) {
    throw new Error("University name is required.");
  }

  let cityId: string | null = null;

  if (city) {
    const { data: existingCity, error: cityFindError } = await supabase
      .from("cities")
      .select("id")
      .ilike("name", city)
      .eq("state", state || "")
      .maybeSingle();

    if (cityFindError) {
      throw new Error(cityFindError.message);
    }

    if (existingCity) {
      cityId = existingCity.id;
    } else {
      const { data: newCity, error: cityCreateError } = await supabase
        .from("cities")
        .insert({
          name: city,
          slug: createSlug(`${city}-${state || "unknown"}`),
          state: state || null,
        })
        .select("id")
        .single();

      if (cityCreateError) {
        throw new Error(cityCreateError.message);
      }

      cityId = newCity.id;
    }
  }

  const { error } = await supabase.from("universities").insert({
    name,
    slug: createSlug(name),
    city_id: cityId,
    state: state || null,
    website: website || null,
    is_active: true,
    source: "admin",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/universities");
}

export async function toggleUniversityStatus(formData: FormData) {
  const supabase = createServiceClient();

  const id = String(formData.get("id") || "").trim();
  const isActive = String(formData.get("is_active")) === "true";

  if (!id) {
    throw new Error("University ID is required.");
  }

  const { error } = await supabase
    .from("universities")
    .update({
      is_active: !isActive,
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/universities");
}
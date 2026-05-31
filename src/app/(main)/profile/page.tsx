"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
  role: string | null;
  is_academic_verified: boolean;
}

export default function ProfilePage() {
  const supabase = createClient();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("first_name,last_name,role,is_academic_verified")
        .eq("id", user.id)
        .single();

      setProfile({
        first_name: data?.first_name ?? "",
        last_name: data?.last_name ?? "",
        email: user.email ?? "",
        role: data?.role ?? "student",
        is_academic_verified: data?.is_academic_verified ?? false,
      });

      setLoading(false);
    }

    loadProfile();
  }, [supabase]);

  async function saveProfile() {
    if (!profile) return;

    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setMessage("You must be signed in.");
      return;
    }

    const { error } = await supabase
      .from("users")
      .update({
        first_name: profile.first_name.trim(),
        last_name: profile.last_name.trim(),
      })
      .eq("id", user.id);

    if (error) {
      setMessage("Something went wrong. Please try again.");
    } else {
      setMessage("Profile updated successfully.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <p className="text-slate-500">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Profile</h1>

        <p className="mt-3 text-slate-600">
          Manage your account information.
        </p>

        <div className="mt-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700">
              First Name
            </label>
            <input
              value={profile?.first_name ?? ""}
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, first_name: e.target.value } : prev
                )
              }
              className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Enter your first name"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Last Name
            </label>
            <input
              value={profile?.last_name ?? ""}
              onChange={(e) =>
                setProfile((prev) =>
                  prev ? { ...prev, last_name: e.target.value } : prev
                )
              }
              className="mt-2 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-blue-500"
              placeholder="Enter your last name"
            />
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Email</p>
            <p className="font-medium">{profile?.email}</p>
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Role</p>
            <p className="font-medium">{profile?.role || "student"}</p>
          </div>

          <div className="rounded-xl border bg-slate-50 p-4">
            <p className="text-xs text-slate-500">Academic Verification</p>
            <p className="font-medium">
              {profile?.is_academic_verified ? "Verified" : "Not Verified"}
            </p>
          </div>

          {message && (
            <p className="text-sm text-slate-600">
              {message}
            </p>
          )}

          <button
            onClick={saveProfile}
            disabled={saving}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </main>
  );
}
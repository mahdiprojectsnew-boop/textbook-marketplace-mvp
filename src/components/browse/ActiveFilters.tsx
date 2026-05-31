"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";

interface Props {
  current: {
    q?: string; type?: string; cond?: string; uni?: string;
    prof?: string; course?: string; minPrice?: string; maxPrice?: string;
  };
  labels: {
    uni?: string; prof?: string; course?: string;
  };
}

const COND_LABELS: Record<string, string> = {
  like_new: "Like New", very_good: "Very Good", good: "Good", fair: "Fair", poor: "Poor",
};

export function ActiveFilters({ current, labels }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [, startTransition] = useTransition();

  function remove(key: string) {
    const next = new URLSearchParams(params.toString());
    next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  const pills = [
    current.q        && { key: "q",        label: `"${current.q}"` },
    current.type     && { key: "type",     label: current.type === "sale" ? "For Sale" : "For Rent" },
    current.cond     && { key: "cond",     label: COND_LABELS[current.cond] ?? current.cond },
    current.uni      && { key: "uni",      label: labels.uni ?? "University" },
    current.prof     && { key: "prof",     label: labels.prof ?? "Professor" },
    current.course   && { key: "course",   label: labels.course ?? "Course" },
    current.minPrice && { key: "minPrice", label: `From $${current.minPrice}` },
    current.maxPrice && { key: "maxPrice", label: `Up to $${current.maxPrice}` },
  ].filter(Boolean) as { key: string; label: string }[];

  if (!pills.length) return null;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs text-[#94a3b8] font-medium">Active:</span>
      {pills.map(pill => (
        <button key={pill.key} onClick={() => remove(pill.key)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff6ff] border border-[#bfdbfe] text-xs font-semibold text-[#1d4ed8] hover:bg-[#dbeafe] transition">
          {pill.label}
          <X size={10} />
        </button>
      ))}
    </div>
  );
}

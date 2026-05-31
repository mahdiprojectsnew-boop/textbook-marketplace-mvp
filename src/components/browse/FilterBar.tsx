"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition, useCallback } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";

interface University { id: string; name: string; state: string | null; }
interface Professor  { id: string; first_name: string; last_name: string; }
interface Course     { id: string; name: string; code: string | null; }

interface Props {
  universities: University[];
  professors:   Professor[];
  courses:      Course[];
  current: {
    type:     string;
    cond:     string;
    uni:      string;
    prof:     string;
    course:   string;
    minPrice: string;
    maxPrice: string;
    sort:     string;
  };
}

const CONDITIONS = [
  { value: "like_new",  label: "Like New"  },
  { value: "very_good", label: "Very Good" },
  { value: "good",      label: "Good"      },
  { value: "fair",      label: "Fair"      },
  { value: "poor",      label: "Poor"      },
];

const SORTS = [
  { value: "newest",     label: "Newest first"      },
  { value: "price_asc",  label: "Price: low → high" },
  { value: "price_desc", label: "Price: high → low" },
];

function Sel({
  param, value, placeholder, children,
  onChange,
}: {
  param: string; value: string; placeholder: string;
  children: React.ReactNode;
  onChange: (param: string, val: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(param, e.target.value)}
        className="appearance-none w-full pl-3 pr-8 py-2 text-sm border border-[#d1d5db] rounded-lg bg-white text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition cursor-pointer"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af] pointer-events-none" />
    </div>
  );
}

export function FilterBar({ universities, professors, courses, current }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [, startTransition] = useTransition();

  const update = useCallback((key: string, val: string) => {
    const next = new URLSearchParams(params.toString());
    if (val) next.set(key, val); else next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }, [params, pathname, router]);

  const activeCount = [current.type, current.cond, current.uni, current.prof, current.course, current.minPrice, current.maxPrice]
    .filter(Boolean).length;

  function clearAll() {
    const next = new URLSearchParams();
    if (params.get("q")) next.set("q", params.get("q")!);
    if (current.sort) next.set("sort", current.sort);
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#374151]">
          <SlidersHorizontal size={14} className="text-[#64748b]" />
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#1d4ed8] text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 transition">
            <X size={11} /> Clear all
          </button>
        )}
      </div>

      {/* Row 1: type + condition + sort */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Sel param="type" value={current.type} placeholder="All types" onChange={update}>
          <option value="sale">For Sale</option>
          <option value="rental">For Rent</option>
        </Sel>
        <Sel param="cond" value={current.cond} placeholder="Any condition" onChange={update}>
          {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </Sel>
        <Sel param="sort" value={current.sort} placeholder="Sort by" onChange={update}>
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Sel>
      </div>

      {/* Row 2: university + professor + course */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Sel param="uni" value={current.uni} placeholder="Any university" onChange={update}>
          {universities.map(u => (
            <option key={u.id} value={u.id}>{u.name}{u.state ? `, ${u.state}` : ""}</option>
          ))}
        </Sel>
        <Sel param="prof" value={current.prof} placeholder="Any professor" onChange={update}>
          {professors.map(p => (
            <option key={p.id} value={p.id}>{p.last_name}, {p.first_name}</option>
          ))}
        </Sel>
        <Sel param="course" value={current.course} placeholder="Any course" onChange={update}>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.code ? `${c.code} — ` : ""}{c.name}</option>
          ))}
        </Sel>
      </div>

      {/* Row 3: price range */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#94a3b8] font-medium shrink-0">Price</span>
        <input
          type="number" min="0" step="1"
          defaultValue={current.minPrice}
          placeholder="Min $"
          onBlur={e => update("minPrice", e.target.value)}
          className="w-24 px-2.5 py-1.5 text-sm border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition"
        />
        <span className="text-xs text-[#94a3b8]">—</span>
        <input
          type="number" min="0" step="1"
          defaultValue={current.maxPrice}
          placeholder="Max $"
          onBlur={e => update("maxPrice", e.target.value)}
          className="w-24 px-2.5 py-1.5 text-sm border border-[#d1d5db] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition"
        />
      </div>
    </div>
  );
}

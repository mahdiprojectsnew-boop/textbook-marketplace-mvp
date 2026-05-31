"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useTransition, useRef, useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";

export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();
  const [pending, startTransition] = useTransition();
  const inputRef   = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const push = useCallback((q: string) => {
    const next = new URLSearchParams(params.toString());
    if (q) next.set("q", q); else next.delete("q");
    next.delete("page"); // reset page on new search
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }, [params, pathname, router]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => push(e.target.value.trim()), 350);
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = "";
    push("");
  }

  return (
    <div className="relative flex-1">
      {pending
        ? <Loader2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] animate-spin" />
        : <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
      }
      <input
        ref={inputRef}
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder="Search by title, ISBN, professor, course, university…"
        className="w-full pl-9 pr-9 py-2.5 text-sm border border-[#d1d5db] rounded-xl bg-white text-[#0f172a] placeholder:text-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent transition"
      />
      {defaultValue && (
        <button onClick={handleClear} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#374151] transition">
          <X size={14} />
        </button>
      )}
    </div>
  );
}

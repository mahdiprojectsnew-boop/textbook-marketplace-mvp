"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Check, X, Loader2 } from "lucide-react";

export interface ComboboxOption {
  id: string;
  label: string;
  sublabel?: string;
}

interface Props {
  label: string;
  options: ComboboxOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  onFreeType: (text: string) => void;
  placeholder: string;
  hint?: string;
  disabled?: boolean;
  loading?: boolean;
  initialText?: string;
}

export function AcademicCombobox({
  label,
  options,
  selectedId,
  onSelect,
  onFreeType,
  placeholder,
  hint,
  disabled = false,
  loading = false,
  initialText = "",
}: Props) {
  const [text, setText] = useState(initialText);
  const [open, setOpen] = useState(false);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const lower = text.toLowerCase();

  const filtered = lower
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(lower) ||
          (o.sublabel ?? "").toLowerCase().includes(lower)
      )
    : options;

  const alreadySelected = options.find((o) => o.id === selectedId);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;

    setText(v);
    setOpen(true);

    if (selectedId) {
      onSelect("");
    }

    onFreeType(v);
  }

  function handlePickOption(opt: ComboboxOption) {
    setText(opt.label);
    onSelect(opt.id);
    setOpen(false);
  }

  function handleUseTyped() {
    if (!text.trim()) return;

    if (selectedId) {
      onSelect("");
    }

    onFreeType(text);
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    setText("");
    onSelect("");
    onFreeType("");
    setOpen(false);

    inputRef.current?.focus();
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
        {label}
      </label>

      <div
        className={`flex items-center rounded-lg border transition-all ${
          disabled
            ? "bg-[#f9fafb] border-[#e5e7eb] cursor-not-allowed"
            : open
              ? "border-[#3b82f6] ring-2 ring-[#3b82f6]/20 bg-white"
              : "border-[#d1d5db] bg-white hover:border-[#93c5fd]"
        }`}
      >
        {loading && (
          <Loader2
            size={14}
            className="ml-3 shrink-0 text-[#94a3b8] animate-spin"
          />
        )}

        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleChange}
          onFocus={() => {
            if (!disabled) setOpen(true);
          }}
          placeholder={disabled ? "Select a university first" : placeholder}
          disabled={disabled}
          autoComplete="off"
          spellCheck={false}
          className={[
            "flex-1 bg-transparent py-2.5 text-sm text-[#111827]",
            "placeholder:text-[#9ca3af] focus:outline-none rounded-lg",
            "disabled:cursor-not-allowed disabled:text-[#9ca3af]",
            loading ? "pl-2 pr-8" : "pl-3 pr-8",
          ].join(" ")}
        />

        {text && !disabled ? (
          <button
            type="button"
            onMouseDown={handleClear}
            className="absolute right-2.5 p-1 text-[#9ca3af] hover:text-[#374151]"
          >
            <X size={12} />
          </button>
        ) : (
          <ChevronDown
            size={13}
            className={`absolute right-2.5 text-[#9ca3af] pointer-events-none transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {open && !disabled && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#e5e7eb] rounded-xl shadow-xl overflow-hidden">
          <ul className="max-h-48 overflow-y-auto">
            {loading ? (
              <li className="flex items-center gap-2 px-4 py-3 text-sm text-[#94a3b8]">
                <Loader2 size={13} className="animate-spin" />
                Searching…
              </li>
            ) : filtered.length > 0 ? (
              <>
                {filtered.map((opt) => (
                  <li key={opt.id}>
                    <button
                      type="button"
                      onMouseDown={() => handlePickOption(opt)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-[#f8fafc] transition"
                    >
                      <span>
                        <span className="font-medium text-[#111827]">
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span className="text-xs text-[#94a3b8] ml-2">
                            {opt.sublabel}
                          </span>
                        )}
                      </span>

                      {opt.id === selectedId && (
                        <Check
                          size={13}
                          className="shrink-0 text-[#1d4ed8]"
                        />
                      )}
                    </button>
                  </li>
                ))}

                {text.trim() && !alreadySelected && (
                  <li className="border-t border-[#f1f5f9]">
                    <button
                      type="button"
                      onMouseDown={handleUseTyped}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[#1d4ed8] hover:bg-[#eff6ff] transition"
                    >
                      <Plus size={13} className="shrink-0" />
                      Add new: <strong className="ml-0.5">"{text}"</strong>
                    </button>
                  </li>
                )}
              </>
            ) : text.trim() ? (
              <li>
                <button
                  type="button"
                  onMouseDown={handleUseTyped}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-[#1d4ed8] hover:bg-[#eff6ff] transition"
                >
                  <Plus size={13} className="shrink-0" />
                  Create: <strong className="ml-0.5">"{text}"</strong>
                </button>
              </li>
            ) : (
              <li className="px-4 py-3 text-sm text-[#94a3b8]">
                Start typing to search…
              </li>
            )}
          </ul>
        </div>
      )}

      {hint && !open && (
        <p className="mt-1.5 text-xs text-[#94a3b8]">{hint}</p>
      )}

      {!selectedId && text.trim() && !open && (
        <p className="mt-1 text-[11px] font-medium text-[#1d4ed8]">
          ✦ Will create new: "{text}"
        </p>
      )}
    </div>
  );
}
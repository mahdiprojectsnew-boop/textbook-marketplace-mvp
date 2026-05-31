"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { AcademicCombobox, type ComboboxOption } from "./AcademicCombobox";

interface University { id: string; name: string; state: string | null; }

export interface AcademicValue {
  universityId:  string;
  professorId:   string;
  professorText: string;
  courseId:      string;
  courseText:    string;
}

interface Props {
  value:                  AcademicValue;
  onChange:               (v: AcademicValue) => void;
  initialProfessorLabel?: string;
  initialCourseLabel?:    string;
}

export function AcademicSection({
  value, onChange,
  initialProfessorLabel = "",
  initialCourseLabel = "",
}: Props) {
  const supabase = createClient();

  const [universities,   setUniversities]   = useState<University[]>([]);
  const [professors,     setProfessors]     = useState<ComboboxOption[]>([]);
  const [courses,        setCourses]        = useState<ComboboxOption[]>([]);
  const [loadingProfs,   setLoadingProfs]   = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const profTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const courseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load universities once on mount
  useEffect(() => {
    supabase
      .from("universities")
      .select("id, name, state")
      .eq("is_active", true)
      .order("name")
      .limit(300)
      .then(({ data }) => setUniversities(data ?? []));
  }, []);

  // Fetch professor suggestions
  const fetchProfessors = useCallback(async (uniId: string, q: string) => {
    if (!uniId) { setProfessors([]); return; }
    setLoadingProfs(true);
    try {
      const params = new URLSearchParams({ type: "professor", university_id: uniId, q });
      const res  = await fetch(`/api/academic/suggest?${params}`);
      const json = await res.json();
      setProfessors(json.results ?? []);
    } catch {
      setProfessors([]);
    } finally {
      setLoadingProfs(false);
    }
  }, []);

  // Fetch course suggestions
  const fetchCourses = useCallback(async (uniId: string, q: string) => {
    if (!uniId) { setCourses([]); return; }
    setLoadingCourses(true);
    try {
      const params = new URLSearchParams({ type: "course", university_id: uniId, q });
      const res  = await fetch(`/api/academic/suggest?${params}`);
      const json = await res.json();
      setCourses(json.results ?? []);
    } catch {
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  // When university is selected, load initial suggestions for both fields
  useEffect(() => {
    if (value.universityId) {
      fetchProfessors(value.universityId, "");
      fetchCourses(value.universityId, "");
    } else {
      setProfessors([]);
      setCourses([]);
    }
  }, [value.universityId, fetchProfessors, fetchCourses]);

  // ── Event handlers ────────────────────────────────────────

  function handleUniversityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    // Reset professor and course when university changes
    onChange({
      universityId:  e.target.value,
      professorId:   "",
      professorText: "",
      courseId:      "",
      courseText:    "",
    });
  }

  function handleProfSelect(id: string) {
    onChange({ ...value, professorId: id, professorText: "" });
  }

  function handleProfFreeType(text: string) {
    if (profTimer.current) clearTimeout(profTimer.current);
    onChange({ ...value, professorId: "", professorText: text });
    if (value.universityId) {
      profTimer.current = setTimeout(
        () => fetchProfessors(value.universityId, text),
        250
      );
    }
  }

  function handleCourseSelect(id: string) {
    onChange({ ...value, courseId: id, courseText: "" });
  }

  function handleCourseFreeType(text: string) {
    if (courseTimer.current) clearTimeout(courseTimer.current);
    onChange({ ...value, courseId: "", courseText: text });
    if (value.universityId) {
      courseTimer.current = setTimeout(
        () => fetchCourses(value.universityId, text),
        250
      );
    }
  }

  const uniDisabled = false;
  const fieldDisabled = !value.universityId;

  return (
    <div className="space-y-4">

      {/* University — native select is fine here, it's an existing-only field */}
      <div>
        <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
          University
        </label>
        <div className="relative">
          <select
            value={value.universityId}
            onChange={handleUniversityChange}
            className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg border border-[#d1d5db] bg-white text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] transition cursor-pointer"
          >
            <option value="">Select university…</option>
            {universities.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}{u.state ? `, ${u.state}` : ""}
              </option>
            ))}
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#9ca3af] text-xs">▾</span>
        </div>
        <p className="mt-1.5 text-xs text-[#94a3b8]">
          Select your university to enable professor and course fields.
        </p>
      </div>

      {/* Professor — INPUT-based combobox, never a <select> */}
      <AcademicCombobox
        label="Professor"
        options={professors}
        selectedId={value.professorId}
        onSelect={handleProfSelect}
        onFreeType={handleProfFreeType}
        placeholder="Search or type professor name"
        hint={
          value.universityId
            ? "Professor not listed? Just type the name — it will be added automatically."
            : undefined
        }
        disabled={fieldDisabled}
        loading={loadingProfs}
        initialText={initialProfessorLabel}
      />

      {/* Course — INPUT-based combobox, requires only university */}
      <AcademicCombobox
        label="Course"
        options={courses}
        selectedId={value.courseId}
        onSelect={handleCourseSelect}
        onFreeType={handleCourseFreeType}
        placeholder="Search or type course name / code"
        hint={
          value.universityId
            ? "e.g. BIO 101 or Introduction to Biology. Course not listed? Just type it."
            : undefined
        }
        disabled={fieldDisabled}
        loading={loadingCourses}
        initialText={initialCourseLabel}
      />

    </div>
  );
}

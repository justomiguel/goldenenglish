"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";

export type AttendanceDraftRow = {
  status: SectionAttendanceStatusDb;
  notes: string;
};

function storageKey(sectionId: string, dateIso: string) {
  return `ge-section-attendance:${sectionId}:${dateIso}`;
}

export function useSectionAttendanceDraft(
  sectionId: string,
  dateIso: string,
  initial: Record<string, AttendanceDraftRow>,
  resetSignal: number,
) {
  const [byEnrollment, setByEnrollment] = useState<Record<string, AttendanceDraftRow>>(initial);
  const key = useMemo(() => storageKey(sectionId, dateIso), [sectionId, dateIso]);

  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window === "undefined") {
        setByEnrollment(initial);
        return;
      }
      try {
        const raw = window.localStorage.getItem(key);
        const parsed = raw ? (JSON.parse(raw) as Record<string, AttendanceDraftRow>) : null;
        if (parsed && typeof parsed === "object") {
          setByEnrollment({ ...initial, ...parsed });
          return;
        }
      } catch {
        /* ignore */
      }
      setByEnrollment(initial);
    });
  }, [key, initial, resetSignal]);

  const persistLocal = useCallback(
    (next: Record<string, AttendanceDraftRow>) => {
      if (typeof window === "undefined") return;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [key],
  );

  const setRow = useCallback(
    (enrollmentId: string, patch: Partial<AttendanceDraftRow>) => {
      setByEnrollment((prev) => {
        const base = prev[enrollmentId] ?? { status: "present", notes: "" };
        const next = { ...prev, [enrollmentId]: { ...base, ...patch } };
        persistLocal(next);
        return next;
      });
    },
    [persistLocal],
  );

  const setAllStatus = useCallback(
    (enrollmentIds: string[], status: SectionAttendanceStatusDb) => {
      setByEnrollment((prev) => {
        const next = { ...prev };
        for (const id of enrollmentIds) {
          const base = next[id] ?? { status: "present", notes: "" };
          next[id] = { ...base, status };
        }
        persistLocal(next);
        return next;
      });
    },
    [persistLocal],
  );

  const clearLocal = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, [key]);

  return { byEnrollment, setRow, setAllStatus, clearLocal };
}

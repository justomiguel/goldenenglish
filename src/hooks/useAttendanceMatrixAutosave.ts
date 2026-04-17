"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import { upsertTeacherAttendanceCellsAction } from "@/app/[locale]/dashboard/teacher/sections/teacherAttendanceMatrixActions";
import { adminUpsertSectionAttendanceCellsAction } from "@/app/[locale]/dashboard/admin/academic/adminSectionAttendanceActions";

type Queued = { enrollmentId: string; attendedOn: string; status: SectionAttendanceStatusDb };

export type AttendanceMatrixAutosaveVariant = "teacher" | "admin";

export function useAttendanceMatrixAutosave(
  variant: AttendanceMatrixAutosaveVariant,
  locale: string,
  sectionId: string,
  debounceMs: number,
  onFlushError?: (code: string) => void,
) {
  const pending = useRef<Map<string, Queued>>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    const batch = [...pending.current.values()];
    pending.current.clear();
    if (batch.length === 0) return { ok: true as const };
    const fd = new FormData();
    fd.set("payload", JSON.stringify({ locale, sectionId, cells: batch }));
    const res =
      variant === "teacher"
        ? await upsertTeacherAttendanceCellsAction(null, fd)
        : await adminUpsertSectionAttendanceCellsAction(null, fd);
    if (!res.ok) onFlushError?.(res.code);
    return res;
  }, [locale, sectionId, variant, onFlushError]);

  const scheduleFlush = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void flush();
    }, debounceMs);
  }, [debounceMs, flush]);

  const queueCell = useCallback(
    (cell: Queued) => {
      const k = `${cell.enrollmentId}|${cell.attendedOn}`;
      pending.current.set(k, cell);
      scheduleFlush();
    },
    [scheduleFlush],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { queueCell, flushNow: flush };
}

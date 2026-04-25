"use client";

import { useCallback, useEffect, useRef } from "react";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import { logClientException } from "@/lib/logging/clientLog";

type Queued = { enrollmentId: string; attendedOn: string; status: SectionAttendanceStatusDb };

export type AttendanceMatrixAutosaveVariant = "teacher" | "admin";

const ENDPOINT: Record<AttendanceMatrixAutosaveVariant, string> = {
  admin: "/api/admin/attendance/cells",
  teacher: "/api/teacher/attendance/cells",
};

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
    try {
      const resp = await fetch(ENDPOINT[variant], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale, sectionId, cells: batch }),
      });
      const res = (await resp.json()) as { ok: boolean; code?: string };
      if (!res.ok) onFlushError?.(res.code ?? "save");
      return res;
    } catch (err) {
      logClientException("attendanceMatrixAutosave:flush", err);
      onFlushError?.("network");
      return { ok: false, code: "network" };
    }
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

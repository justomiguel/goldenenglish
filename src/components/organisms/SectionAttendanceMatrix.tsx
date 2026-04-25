"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import type { TeacherAttendanceMatrixPayload } from "@/types/teacherAttendanceMatrix";
import { defaultMatrixFocus, firstMatrixCellInColumn } from "@/lib/academics/teacherAttendanceMatrixNav";
import {
  useAttendanceMatrixAutosave,
  type AttendanceMatrixAutosaveVariant,
} from "@/hooks/useAttendanceMatrixAutosave";
import { useSectionAttendanceMatrixBulk } from "@/hooks/useSectionAttendanceMatrixBulk";
import { TeacherAttendanceMatrixCalendarPanel } from "@/components/molecules/TeacherAttendanceMatrixCalendarPanel";
import {
  TeacherAttendanceMatrixViewTabs,
  type TeacherAttendanceMatrixView,
} from "@/components/molecules/TeacherAttendanceMatrixViewTabs";
import { TeacherAttendanceMatrixTable } from "@/components/organisms/TeacherAttendanceMatrixTable";
import { Button } from "@/components/atoms/Button";

export interface SectionAttendanceMatrixProps {
  variant: AttendanceMatrixAutosaveVariant;
  locale: string;
  sectionId: string;
  todayIso: string;
  initialPayloadJson: string;
  editableByDateJson: string;
  scheduleLine: string;
  matrixDict: Dictionary["dashboard"]["teacherSectionAttendance"]["matrix"];
  offlineHint: string;
}

export function SectionAttendanceMatrix({
  variant,
  locale,
  sectionId,
  todayIso,
  initialPayloadJson,
  editableByDateJson,
  scheduleLine,
  matrixDict,
  offlineHint,
}: SectionAttendanceMatrixProps) {
  const router = useRouter();
  const payload = useMemo(() => JSON.parse(initialPayloadJson) as TeacherAttendanceMatrixPayload, [initialPayloadJson]);
  const editableByDate = useMemo(
    () => JSON.parse(editableByDateJson) as Record<string, boolean>,
    [editableByDateJson],
  );

  const [cells, setCells] = useState(() => structuredClone(payload.cells));
  const [focused, setFocused] = useState<{ enrollmentId: string; dateIso: string } | null>(null);
  const [columnBusyDate, setColumnBusyDate] = useState<string | null>(null);
  const [undoOffer, setUndoOffer] = useState<{ dateIso: string; ids: string[] } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<TeacherAttendanceMatrixView>("sheet");
  const [sheetJumpIso, setSheetJumpIso] = useState<string | null>(null);
  const [payloadSnapshot, setPayloadSnapshot] = useState({
    payloadJson: initialPayloadJson,
    todayIso,
  });

  if (
    payloadSnapshot.payloadJson !== initialPayloadJson ||
    payloadSnapshot.todayIso !== todayIso
  ) {
    setPayloadSnapshot({ payloadJson: initialPayloadJson, todayIso });
    const p = JSON.parse(initialPayloadJson) as TeacherAttendanceMatrixPayload;
    if (p.classDays.length > 0) {
      setCells(structuredClone(p.cells));
      setFocused(defaultMatrixFocus(p.rows, p.classDays, p.cells, todayIso));
    }
  }

  const onFlushError = useCallback(() => {
    setToast(matrixDict.autosaveError);
  }, [matrixDict.autosaveError]);

  const { queueCell, flushNow } = useAttendanceMatrixAutosave(variant, locale, sectionId, 550, onFlushError);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") void flushNow();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [flushNow]);

  const { handleColumnFill, handleUndo } = useSectionAttendanceMatrixBulk(
    variant,
    locale,
    sectionId,
    router,
    matrixDict,
    setCells,
    setToast,
    setColumnBusyDate,
    setUndoOffer,
  );

  useEffect(() => {
    if (!sheetJumpIso || viewMode !== "sheet") return;
    queueMicrotask(() => {
      document.getElementById(`teacher-att-col-${sheetJumpIso}`)?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
      setFocused(firstMatrixCellInColumn(payload.rows, cells, sheetJumpIso));
      setSheetJumpIso(null);
    });
  }, [sheetJumpIso, viewMode, payload.rows, cells]);

  useEffect(() => {
    if (!undoOffer) return;
    const t = setTimeout(() => setUndoOffer(null), 12000);
    return () => clearTimeout(t);
  }, [undoOffer]);

  const onPickCalendarDay = useCallback((iso: string) => {
    setViewMode("sheet");
    setSheetJumpIso(iso);
  }, []);

  const onCellStatus = useCallback(
    (enrollmentId: string, dateIso: string, status: SectionAttendanceStatusDb) => {
      if (variant === "teacher" && !editableByDate[dateIso]) return;
      setCells((prev) => {
        const next = structuredClone(prev);
        if (next[enrollmentId]?.[dateIso] === undefined) return prev;
        next[enrollmentId]![dateIso] = status;
        return next;
      });
      queueCell({ enrollmentId, attendedOn: dateIso, status });
    },
    [editableByDate, queueCell, variant],
  );

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const editingPast = focused && focused.dateIso < todayIso;
  const keyboardHintText = variant === "admin" ? matrixDict.keyboardHintAdmin : matrixDict.keyboardHint;

  if (payload.classDays.length === 0 || payload.rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{matrixDict.empty}</p>;
  }

  return (
    <div className="space-y-3 pb-16">
      <TeacherAttendanceMatrixViewTabs view={viewMode} onViewChange={setViewMode} dict={matrixDict} />
      {payload.classDaysTruncated ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {variant === "admin" ? matrixDict.datesTruncatedNewest : matrixDict.datesTruncatedNote}
        </p>
      ) : null}
      {toast ? (
        <p role="status" className="text-sm text-[var(--color-muted-foreground)]">
          {toast}
        </p>
      ) : null}
      {undoOffer ? (
        <div className="flex flex-wrap items-center gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 px-3 py-2">
          <span className="text-sm text-[var(--color-foreground)]">{matrixDict.undoPrompt}</span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="min-h-10 gap-1"
            onClick={() => void handleUndo(undoOffer)}
          >
            <Undo2 className="h-4 w-4" aria-hidden />
            {matrixDict.undoAction}
          </Button>
        </div>
      ) : null}
      {viewMode === "calendar" ? (
        <TeacherAttendanceMatrixCalendarPanel
          locale={locale}
          classDays={payload.classDays}
          scheduleLine={scheduleLine}
          dict={matrixDict}
          onPickClassDay={onPickCalendarDay}
        />
      ) : (
        <>
          {editingPast ? (
            <div
              role="status"
              className="rounded-[var(--layout-border-radius)] border border-[var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            >
              {matrixDict.editingPastDayBanner}
            </div>
          ) : null}
          <p className="text-xs text-[var(--color-muted-foreground)]">{keyboardHintText}</p>
          <TeacherAttendanceMatrixTable
            locale={locale}
            rows={payload.rows}
            classDays={payload.classDays}
            cells={cells}
            editableByDate={editableByDate}
            todayIso={todayIso}
            holidayLabels={payload.holidayLabels}
            focused={focused}
            onFocusChange={setFocused}
            onCellStatus={onCellStatus}
            onColumnFill={(d) => void handleColumnFill(d)}
            columnBusyDate={columnBusyDate}
            dict={matrixDict}
            matrixMode={variant}
          />
        </>
      )}
      <p className="text-xs text-[var(--color-muted-foreground)]">{offlineHint}</p>
    </div>
  );
}

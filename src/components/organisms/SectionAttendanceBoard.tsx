"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import type { Dictionary } from "@/types/i18n";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import { useSectionAttendanceDraft } from "@/hooks/useSectionAttendanceDraft";
import {
  upsertAttendanceAction,
  type UpsertAttendanceActionState,
} from "@/app/[locale]/dashboard/teacher/sections/attendanceActions";
import { Button } from "@/components/atoms/Button";
import { TeacherPatAttendanceRow, type TeacherPatClickable } from "@/components/molecules/TeacherPatAttendanceRow";

function FloatingSubmit({ label, savingLabel }: { label: string; savingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      size="lg"
      className="min-h-[52px] w-full shadow-[var(--shadow-card)] sm:w-auto"
      isLoading={pending}
      disabled={pending}
    >
      {pending ? savingLabel : label}
    </Button>
  );
}

export interface SectionAttendanceBoardProps {
  locale: string;
  sectionId: string;
  dateIso: string;
  initialJson: string;
  students: { enrollmentId: string; label: string }[];
  irregularSunday: boolean;
  irregularHoliday: boolean;
  holidayLabel: string;
  dict: Dictionary["dashboard"]["teacherSectionAttendance"];
}

export function SectionAttendanceBoard({
  locale,
  sectionId,
  dateIso,
  initialJson,
  students,
  irregularSunday,
  irregularHoliday,
  holidayLabel,
  dict,
}: SectionAttendanceBoardProps) {
  const router = useRouter();
  const initial = useMemo(
    () => JSON.parse(initialJson) as Record<string, { status: SectionAttendanceStatusDb; notes: string }>,
    [initialJson],
  );
  const [resetSignal, setResetSignal] = useState(0);
  const { byEnrollment, setRow, setAllStatus, clearLocal } = useSectionAttendanceDraft(
    sectionId,
    dateIso,
    initial,
    resetSignal,
  );
  const [state, formAction] = useActionState(upsertAttendanceAction, null as UpsertAttendanceActionState | null);
  const fired = useRef(false);
  const [irregularOk, setIrregularOk] = useState(!(irregularSunday || irregularHoliday));

  useEffect(() => {
    queueMicrotask(() => {
      setIrregularOk(!(irregularSunday || irregularHoliday));
    });
  }, [irregularSunday, irregularHoliday, dateIso, sectionId]);

  useEffect(() => {
    if (!state?.ok) {
      fired.current = false;
      return;
    }
    if (fired.current) return;
    fired.current = true;
    queueMicrotask(() => {
      clearLocal();
      setResetSignal((n) => n + 1);
      router.refresh();
    });
  }, [state, clearLocal, router]);

  const errMsg =
    state && !state.ok
      ? state.code === "validation"
        ? dict.errorValidation
        : state.code === "forbidden"
          ? dict.errorForbidden
          : state.code === "save"
            ? dict.errorSave
            : state.code === "outside_window"
              ? dict.errorOutsideWindow
              : state.code === "ineligible_enrollment"
                ? dict.errorIneligible
                : dict.errorAuth
      : null;

  const payload = useMemo(() => {
    const rows = students.map((s) => {
      const row = byEnrollment[s.enrollmentId] ?? { status: "present" as const, notes: "" };
      return {
        enrollmentId: s.enrollmentId,
        status: row.status,
        notes: row.notes?.trim() ? row.notes.trim() : null,
      };
    });
    return JSON.stringify({ locale, sectionId, attendedOn: dateIso, rows });
  }, [byEnrollment, dateIso, locale, sectionId, students]);

  const enrollmentIds = useMemo(() => students.map((s) => s.enrollmentId), [students]);
  const needsIrregularAck = irregularSunday || irregularHoliday;

  return (
    <form
      action={formAction}
      className="space-y-4 pb-28"
      onSubmit={(e) => {
        if (needsIrregularAck && !irregularOk) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="payload" value={payload} readOnly />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-[44px]"
          onClick={() => setAllStatus(enrollmentIds, "present")}
        >
          {dict.markAllPresent}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-[44px]"
          onClick={() => setAllStatus(enrollmentIds, "absent")}
        >
          {dict.markAllAbsent}
        </Button>
      </div>

      {needsIrregularAck ? (
        <div
          role="status"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_12%,transparent)] px-4 py-3 text-sm text-[var(--color-foreground)]"
        >
          <p>
            {irregularSunday
              ? dict.irregularSunday
              : dict.irregularHoliday.replace("{label}", holidayLabel || "—")}
          </p>
          <label className="mt-3 flex cursor-pointer items-center gap-2 font-medium">
            <input
              type="checkbox"
              checked={irregularOk}
              onChange={(e) => setIrregularOk(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)]"
            />
            {dict.irregularConfirm}
          </label>
        </div>
      ) : null}

      <p className="text-sm text-[var(--color-muted-foreground)]">{dict.defaultPresentHint}</p>
      {errMsg ? (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {errMsg}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="text-sm text-[var(--color-primary)]">
          {dict.savedOk}
        </p>
      ) : null}

      <ul className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 sm:px-4">
        {students.map((s) => (
          <TeacherPatAttendanceRow
            key={s.enrollmentId}
            label={s.label}
            value={(byEnrollment[s.enrollmentId]?.status ?? "present") as SectionAttendanceStatusDb}
            onChange={(next: TeacherPatClickable) => setRow(s.enrollmentId, { status: next })}
            dict={dict.patShortLabels}
          />
        ))}
      </ul>

      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.offlineHint}</p>

      <div
        className="fixed bottom-0 left-0 right-0 z-[120] flex justify-center border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 p-3 backdrop-blur-sm md:justify-end md:pr-8"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))" }}
      >
        <FloatingSubmit label={dict.saveFloating} savingLabel={dict.saving} />
      </div>
    </form>
  );
}

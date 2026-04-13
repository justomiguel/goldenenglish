"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminAttendanceMatrixModel } from "@/lib/academics/loadAdminSectionAttendanceMatrix";
import type { Dictionary } from "@/types/i18n";
import type { SectionAttendanceStatusDb } from "@/types/sectionAcademics";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import {
  adminUpsertSectionAttendanceCellAction,
  type AdminAttendanceCellState,
} from "@/app/[locale]/dashboard/admin/academic/adminSectionAttendanceActions";

const STATUS_ORDER: SectionAttendanceStatusDb[] = ["present", "absent", "late", "excused"];

const STATUS_SURFACE: Record<SectionAttendanceStatusDb, string> = {
  present: "bg-[var(--color-success)]",
  absent: "bg-[var(--color-error)]",
  late: "bg-[var(--color-warning)]",
  excused: "bg-[var(--color-muted-foreground)]",
};

export interface AdminSectionAttendanceMatrixProps {
  locale: string;
  cohortId: string;
  sectionId: string;
  model: AdminAttendanceMatrixModel;
  dict: Dictionary["dashboard"]["academicSectionAttendance"];
}

export function AdminSectionAttendanceMatrix({
  locale,
  cohortId,
  sectionId,
  model,
  dict,
}: AdminSectionAttendanceMatrixProps) {
  const router = useRouter();
  const submitAttempt = useRef(false);
  const [picker, setPicker] = useState<{
    enrollmentId: string;
    studentLabel: string;
    dateIso: string;
    current: AdminAttendanceMatrixModel["rows"][0]["cells"][string];
  } | null>(null);
  const [pick, setPick] = useState<SectionAttendanceStatusDb>("present");
  const [state, formAction] = useActionState(adminUpsertSectionAttendanceCellAction, null as AdminAttendanceCellState | null);

  useEffect(() => {
    if (!submitAttempt.current || state === null) return;
    submitAttempt.current = false;
    if (state.ok && picker) {
      queueMicrotask(() => {
        setPicker(null);
        router.refresh();
      });
    }
  }, [state, picker, router]);

  const statusLabels: Record<SectionAttendanceStatusDb, string> = {
    present: dict.matrixStatusPresent,
    absent: dict.matrixStatusAbsent,
    late: dict.matrixStatusLate,
    excused: dict.matrixStatusExcused,
  };

  const dfShort = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }), [locale]);

  const payload = useMemo(() => {
    if (!picker) return "";
    return JSON.stringify({
      locale,
      cohortId,
      sectionId,
      enrollmentId: picker.enrollmentId,
      attendedOn: picker.dateIso,
      status: pick,
    });
  }, [cohortId, locale, pick, picker, sectionId]);

  if (model.rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{dict.empty}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-max border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/50">
            <th className="sticky left-0 z-[1] min-w-[140px] bg-[var(--color-muted)] px-2 py-2 font-medium text-[var(--color-foreground)]">
              {""}
            </th>
            {model.dates.map((d) => (
              <th key={d} className="min-w-[36px] px-1 py-2 text-center font-medium text-[var(--color-muted-foreground)]">
                {dfShort.format(new Date(`${d}T12:00:00.000Z`))}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {model.rows.map((row) => (
            <tr key={row.enrollmentId} className="border-b border-[var(--color-border)]">
              <th className="sticky left-0 z-[1] bg-[var(--color-surface)] px-2 py-2 text-left text-sm font-medium text-[var(--color-foreground)]">
                {row.studentLabel}
              </th>
              {model.dates.map((d) => {
                const v = row.cells[d];
                const aria = dict.cellAria.replace("{student}", row.studentLabel).replace("{date}", d);
                return (
                  <td key={d} className="p-1 text-center">
                    <button
                      type="button"
                      aria-label={aria}
                      className={`mx-auto flex h-8 w-8 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] ${
                        v ? STATUS_SURFACE[v] : "bg-[var(--color-muted)]/40"
                      }`}
                      onClick={() => {
                        setPicker({
                          enrollmentId: row.enrollmentId,
                          studentLabel: row.studentLabel,
                          dateIso: d,
                          current: v,
                        });
                        setPick(v ?? "present");
                      }}
                    >
                      <span className="sr-only">{aria}</span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      <Modal
        open={picker !== null}
        onOpenChange={(o) => {
          if (!o) setPicker(null);
        }}
        titleId="admin-att-cell-title"
        title={dict.pickerTitle}
        stackClassName="z-[200]"
      >
        {picker ? (
          <form
            key={`${picker.enrollmentId}-${picker.dateIso}`}
            action={formAction}
            className="space-y-4"
            onSubmit={() => {
              submitAttempt.current = true;
            }}
          >
            <input type="hidden" name="payload" value={payload} readOnly />
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {picker.studentLabel} · {picker.dateIso}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`min-h-[44px] rounded-[var(--layout-border-radius)] border-2 px-2 text-sm font-semibold ${
                    pick === s
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)]"
                  }`}
                  onClick={() => setPick(s)}
                >
                  {statusLabels[s]}
                </button>
              ))}
            </div>
            {state && !state.ok ? (
              <p role="alert" className="text-sm text-[var(--color-error)]">
                {dict.saveError}
              </p>
            ) : null}
            {state?.ok ? <p className="text-sm text-[var(--color-primary)]">{dict.saveOk}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="primary">
                {dict.saveCell}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setPicker(null)}>
                {dict.cancel}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

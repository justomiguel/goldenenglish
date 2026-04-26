"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentConflict, SectionScheduleSlot } from "@/types/academics";
import { Button } from "@/components/atoms/Button";
import {
  adminDirectSectionMoveAction,
  enrollStudentInSectionAction,
  previewSectionEnrollmentAction,
} from "@/app/[locale]/dashboard/admin/academics/actions";
import { ScheduleConflictResolutionModal } from "@/components/molecules/ScheduleConflictResolutionModal";
import {
  AcademicSectionRosterToolbar,
  type SectionRosterTabKey,
} from "@/components/organisms/AcademicSectionRosterToolbar";

export type SectionRosterRow = {
  enrollmentId: string;
  studentId: string;
  label: string;
  status: string;
};

function rowInTab(tab: SectionRosterTabKey, status: string) {
  if (tab === "active") return status === "active" || status === "completed";
  if (tab === "dropped") return status === "dropped";
  return status === "transferred";
}

export interface AcademicSectionRosterTableProps {
  locale: string;
  sectionId: string;
  rows: SectionRosterRow[];
  moveTargets: { id: string; label: string }[];
  dict: Dictionary["dashboard"]["academicSectionPage"];
  conflictDict: Dictionary["dashboard"]["academics"]["conflictModal"];
  errors: Dictionary["dashboard"]["academics"]["errors"];
  /** Student profile id → guardian has pending payments */
  debtByStudentId?: Record<string, boolean>;
}

export function AcademicSectionRosterTable({
  locale,
  sectionId,
  rows,
  moveTargets,
  dict,
  conflictDict,
  errors,
  debtByStudentId = {},
}: AcademicSectionRosterTableProps) {
  const router = useRouter();
  const [tab, setTab] = useState<SectionRosterTabKey>("active");
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [conflicts, setConflicts] = useState<SectionEnrollmentConflict[] | null>(null);
  const [targetSlots, setTargetSlots] = useState<SectionScheduleSlot[]>([]);
  const [targetLabel, setTargetLabel] = useState("");
  const [moveCtx, setMoveCtx] = useState<{ studentId: string; toId: string } | null>(null);

  const filtered = useMemo(() => rows.filter((r) => rowInTab(tab, r.status)), [rows, tab]);

  const activeEnrollmentId = (studentId: string) => {
    const active = rows.find(
      (r) => r.studentId === studentId && (r.status === "active" || r.status === "completed"),
    );
    return active?.enrollmentId ?? null;
  };

  const runMove = (studentId: string) => {
    const toId = picks[studentId];
    if (!toId) return;
    const dropId = activeEnrollmentId(studentId);
    if (!dropId) return;
    setMsg(null);
    setMoveCtx({ studentId, toId });
    start(async () => {
      const pre = await previewSectionEnrollmentAction({
        studentId,
        sectionId: toId,
        ignoreEnrollmentId: dropId,
        allowCapacityOverride: capacityOverride,
      });
      if (pre.ok) {
        const mv = await adminDirectSectionMoveAction({
          locale,
          studentId,
          fromSectionId: sectionId,
          toSectionId: toId,
          allowCapacityOverride: capacityOverride,
        });
        setMsg(mv.ok ? dict.successMove : dict.genericError);
        if (mv.ok) router.refresh();
        setMoveCtx(null);
        return;
      }
      if (pre.code === "CAPACITY_EXCEEDED" && !capacityOverride) {
        setMsg(errors.CAPACITY_EXCEEDED);
        setMoveCtx(null);
        return;
      }
      if (pre.code === "SCHEDULE_OVERLAP" && pre.conflicts?.length && pre.targetSlots) {
        setConflicts(pre.conflicts);
        setTargetSlots(pre.targetSlots);
        setTargetLabel(moveTargets.find((m) => m.id === toId)?.label ?? toId);
        setModalOpen(true);
        return;
      }
      const err = errors[pre.code as keyof typeof errors] ?? errors.RPC;
      setMsg(err);
      setMoveCtx(null);
    });
  };

  const confirmConflictMove = (dropEnrollmentId: string) => {
    if (!moveCtx) return;
    start(async () => {
      const r = await enrollStudentInSectionAction({
        locale,
        studentId: moveCtx.studentId,
        sectionId: moveCtx.toId,
        dropSectionEnrollmentId: dropEnrollmentId,
        dropNextStatus: "transferred",
        allowCapacityOverride: capacityOverride,
      });
      if (r.ok) {
        setModalOpen(false);
        setConflicts(null);
        setMoveCtx(null);
        setMsg(dict.successMove);
        router.refresh();
        return;
      }
      setMsg(errors[r.code as keyof typeof errors] ?? errors.RPC);
    });
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.rosterTitle}</h2>
      <AcademicSectionRosterToolbar
        dict={dict}
        tab={tab}
        onTab={setTab}
        capacityOverride={capacityOverride}
        onCapacityOverride={setCapacityOverride}
        busy={busy}
        msg={msg}
      />
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--color-border)] text-xs uppercase text-[var(--color-muted-foreground)]">
            <tr>
              <th className="py-2 pr-3">{dict.colStudent}</th>
              <th className="py-2 pr-3">{dict.colStatus}</th>
              <th className="py-2">{dict.colActions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-[var(--color-muted-foreground)]">
                  {dict.emptyTab}
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.enrollmentId} className="border-t border-[var(--color-border)]">
                    <td className="py-2 pr-3 font-medium text-[var(--color-foreground)]">
                      <span className="inline-flex items-center gap-1.5">
                        {r.label}
                        {debtByStudentId[r.studentId] ? (
                          <span
                            className="inline-flex shrink-0 rounded-full border border-[var(--color-error)] p-0.5 text-[var(--color-error)]"
                            title={dict.debtBadge}
                            aria-label={dict.debtBadge}
                          >
                            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                          </span>
                        ) : null}
                      </span>
                    </td>
                  <td className="py-2 pr-3 text-[var(--color-muted-foreground)]">{r.status}</td>
                  <td className="py-2">
                    {tab === "active" && moveTargets.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          className="max-w-[14rem] rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1 text-xs"
                          value={picks[r.studentId] ?? ""}
                          onChange={(e) =>
                            setPicks((prev) => ({ ...prev, [r.studentId]: e.target.value }))
                          }
                          disabled={busy}
                        >
                          <option value="">{dict.moveSelect}</option>
                          {moveTargets.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy || !picks[r.studentId]}
                          isLoading={busy && moveCtx?.studentId === r.studentId}
                          onClick={() => runMove(r.studentId)}
                        >
                          {!(busy && moveCtx?.studentId === r.studentId) ? (
                            <ArrowRightLeft className="h-4 w-4 shrink-0" aria-hidden />
                          ) : null}
                          {dict.moveRun}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[var(--color-muted-foreground)]">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ScheduleConflictResolutionModal
        open={modalOpen && Boolean(conflicts?.length)}
        onClose={() => {
          setModalOpen(false);
          setMoveCtx(null);
        }}
        locale={locale}
        dict={conflictDict}
        conflicts={conflicts ?? []}
        targetSlots={targetSlots}
        targetSectionLabel={targetLabel}
        onConfirmDrop={confirmConflictMove}
        isPending={busy}
      />
    </section>
  );
}

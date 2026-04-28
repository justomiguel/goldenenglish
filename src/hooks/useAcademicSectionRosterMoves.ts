"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentConflict, SectionScheduleSlot } from "@/types/academics";
import type { SectionRosterRow } from "@/types/sectionRoster";
import {
  adminDirectSectionMoveAction,
  enrollStudentInSectionAction,
  previewSectionEnrollmentAction,
} from "@/app/[locale]/dashboard/admin/academics/actions";

export function useAcademicSectionRosterMoves(
  locale: string,
  sectionId: string,
  rows: SectionRosterRow[],
  moveTargets: { id: string; label: string }[],
  dict: Dictionary["dashboard"]["academicSectionPage"],
  errors: Dictionary["dashboard"]["academics"]["errors"],
) {
  const router = useRouter();
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [conflicts, setConflicts] = useState<SectionEnrollmentConflict[] | null>(null);
  const [targetSlots, setTargetSlots] = useState<SectionScheduleSlot[]>([]);
  const [targetLabel, setTargetLabel] = useState("");
  const [moveCtx, setMoveCtx] = useState<{ studentId: string; toId: string } | null>(null);

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

  return {
    picks,
    setPicks,
    capacityOverride,
    setCapacityOverride,
    msg,
    busy,
    modalOpen,
    setModalOpen,
    conflicts,
    targetSlots,
    targetLabel,
    moveCtx,
    setMoveCtx,
    runMove,
    confirmConflictMove,
  };
}

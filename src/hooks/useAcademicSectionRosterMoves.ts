"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  previewSectionEnrollmentAction,
} from "@/app/[locale]/dashboard/admin/academics/actions";
import {
  moveStudentSectionWithCarryAction,
  previewSectionMoveCarryAction,
} from "@/app/[locale]/dashboard/admin/academic/moveStudentSectionWithCarryAction";
import type { SectionMoveCarryFacts } from "@/lib/academics/loadSectionMoveCarryFacts";
import type { CarryResolution, SectionMoveCarryFlags } from "@/lib/academics/planSectionMoveCarry";
import { sectionMoveCarryFailureMessage } from "@/lib/academics/sectionMoveCarryFailureMessage";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentConflict, SectionScheduleSlot } from "@/types/academics";
import type { SectionRosterRow } from "@/types/sectionRoster";

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
  const [carryOpen, setCarryOpen] = useState(false);
  const [facts, setFacts] = useState<SectionMoveCarryFacts | null>(null);
  const [pendingCarry, setPendingCarry] = useState<{
    flags: SectionMoveCarryFlags;
    choices: CarryResolution[];
  } | null>(null);
  const [conflicts, setConflicts] = useState<SectionEnrollmentConflict[] | null>(null);
  const [targetSlots, setTargetSlots] = useState<SectionScheduleSlot[]>([]);
  const [targetLabel, setTargetLabel] = useState("");
  const [moveCtx, setMoveCtx] = useState<{ studentId: string; toId: string; fromEnrollmentId: string } | null>(null);

  const fail = (code: string, detail?: string) => {
    setMsg(sectionMoveCarryFailureMessage(code, detail, errors, errors.unknownError));
  };

  const activeEnrollmentId = (studentId: string) => {
    const active = rows.find((r) => r.studentId === studentId && (r.status === "active" || r.status === "completed"));
    return active?.enrollmentId ?? null;
  };

  const commit = async (
    ctx: { studentId: string; toId: string; fromEnrollmentId: string },
    carry: { flags: SectionMoveCarryFlags; choices: CarryResolution[] },
    alsoTransferEnrollmentId: string | null,
  ) => {
    const mv = await moveStudentSectionWithCarryAction({
      locale,
      studentId: ctx.studentId,
      toSectionId: ctx.toId,
      fromEnrollmentIds: [ctx.fromEnrollmentId],
      alsoTransferEnrollmentId,
      allowCapacityOverride: capacityOverride,
      carry: carry.flags,
      choices: carry.choices,
    });
    setCarryOpen(false);
    setModalOpen(false);
    if (!mv.ok) {
      fail(mv.code, mv.detail);
      return;
    }
    setMoveCtx(null);
    setPendingCarry(null);
    setMsg(dict.successMove);
    router.refresh();
  };

  const runMove = (studentId: string) => {
    const toId = picks[studentId];
    const fromEnrollmentId = activeEnrollmentId(studentId);
    if (!toId || !fromEnrollmentId) return;
    setMsg(null);
    setFacts(null);
    setMoveCtx({ studentId, toId, fromEnrollmentId });
    setCarryOpen(true);
    start(async () => {
      const pre = await previewSectionMoveCarryAction({
        studentId,
        toSectionId: toId,
        fromEnrollmentIds: [fromEnrollmentId],
      });
      if (!pre.ok) {
        setCarryOpen(false);
        fail(pre.code);
        return;
      }
      setFacts(pre.facts);
    });
  };

  const confirmCarry = (flags: SectionMoveCarryFlags, choices: CarryResolution[]) => {
    if (!moveCtx) return;
    const carry = { flags, choices };
    setPendingCarry(carry);
    start(async () => {
      const pre = await previewSectionEnrollmentAction({
        studentId: moveCtx.studentId,
        sectionId: moveCtx.toId,
        ignoreEnrollmentId: moveCtx.fromEnrollmentId,
        allowCapacityOverride: capacityOverride,
      });
      if (pre.ok) {
        await commit(moveCtx, carry, null);
        return;
      }
      if (pre.code === "CAPACITY_EXCEEDED" && !capacityOverride) {
        fail("CAPACITY_EXCEEDED");
        return;
      }
      if (pre.code === "SCHEDULE_OVERLAP" && pre.conflicts?.length && pre.targetSlots) {
        setCarryOpen(false);
        setConflicts(pre.conflicts);
        setTargetSlots(pre.targetSlots);
        setTargetLabel(moveTargets.find((m) => m.id === moveCtx.toId)?.label ?? moveCtx.toId);
        setModalOpen(true);
        return;
      }
      fail(pre.code);
    });
  };

  const confirmConflictMove = (dropEnrollmentId: string) => {
    if (!moveCtx || !pendingCarry) return;
    start(async () => {
      await commit(moveCtx, pendingCarry, dropEnrollmentId);
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
    carryOpen,
    setCarryOpen,
    facts,
    conflicts,
    targetSlots,
    targetLabel,
    moveCtx,
    setMoveCtx,
    runMove,
    confirmCarry,
    confirmConflictMove,
  };
}

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  enrollStudentInSectionAction,
  previewSectionEnrollmentAction,
} from "@/app/[locale]/dashboard/admin/academics/actions";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import type { SectionEnrollmentConflict, SectionScheduleSlot } from "@/types/academics";

export type SectionEnrollmentQueueCopy = {
  previewOk: string;
  bulkPreviewAllOk: string;
  bulkPreviewIssues: string;
  bulkEnrollDoneMany: string;
  bulkEnrollPartial: string;
  bulkEnrollFailed: string;
  successEnroll: string;
};

function errorLine(
  errors: Record<string, string>,
  code: string,
  label: string,
): string {
  const err = errors[code as keyof typeof errors] ?? errors.RPC ?? code;
  return `${label}: ${err}`;
}

export function useSectionEnrollmentQueue(input: {
  locale: string;
  sectionId: string;
  capacityOverride: boolean;
  errors: Record<string, string>;
  copy: SectionEnrollmentQueueCopy;
  onEnrollSuccess?: () => void;
}) {
  const { locale, sectionId, capacityOverride, errors, copy, onEnrollSuccess } = input;
  const [queue, setQueue] = useState<AdminStudentSearchHitLike[]>([]);
  const queueRef = useRef(queue);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const [fieldResetKey, setFieldResetKey] = useState(0);
  const [msg, setMsg] = useState<string | null>(null);
  const [warnParent, setWarnParent] = useState(false);
  const [conflicts, setConflicts] = useState<SectionEnrollmentConflict[] | null>(null);
  const [targetSlots, setTargetSlots] = useState<SectionScheduleSlot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewPending, startPreview] = useTransition();
  const [enrollPending, startEnroll] = useTransition();
  const busy = previewPending || enrollPending;

  const addPick = useCallback((hit: AdminStudentSearchHitLike) => {
    setQueue((q) => (q.some((s) => s.id === hit.id) ? q : [...q, hit]));
    setFieldResetKey((k) => k + 1);
  }, []);

  const removeId = useCallback((id: string) => {
    setQueue((q) => q.filter((s) => s.id !== id));
  }, []);

  const head = queue[0] ?? null;

  const runPreviewSingle = useCallback(() => {
    if (!head) return;
    setMsg(null);
    setConflicts(null);
    startPreview(async () => {
      const r = await previewSectionEnrollmentAction({
        studentId: head.id,
        sectionId,
        allowCapacityOverride: capacityOverride,
      });
      if (r.ok) {
        setWarnParent(Boolean(r.parentPaymentsPending));
        setMsg(copy.previewOk);
        return;
      }
      if (r.code === "SCHEDULE_OVERLAP" && r.conflicts?.length && r.targetSlots) {
        setConflicts(r.conflicts);
        setTargetSlots(r.targetSlots);
        setWarnParent(Boolean(r.parentPaymentsPending));
        setModalOpen(true);
        return;
      }
      const err = errors[r.code as keyof typeof errors] ?? errors.RPC;
      setMsg(err);
    });
  }, [head, sectionId, capacityOverride, errors, copy.previewOk]);

  const runPreviewAll = useCallback(() => {
    const list = queueRef.current;
    if (list.length < 2) return;
    setMsg(null);
    setConflicts(null);
    startPreview(async () => {
      const lines: string[] = [];
      let pending = false;
      for (const s of list) {
        const r = await previewSectionEnrollmentAction({
          studentId: s.id,
          sectionId,
          allowCapacityOverride: capacityOverride,
        });
        if (r.ok) {
          if (r.parentPaymentsPending) pending = true;
          continue;
        }
        lines.push(errorLine(errors, r.code, s.label));
      }
      setWarnParent(pending);
      if (lines.length === 0) {
        setMsg(copy.bulkPreviewAllOk.replace("{{count}}", String(list.length)));
      } else {
        setMsg(copy.bulkPreviewIssues.replace("{{detail}}", lines.join(" · ")));
      }
    });
  }, [sectionId, capacityOverride, errors, copy.bulkPreviewAllOk, copy.bulkPreviewIssues]);

  const runPreview = useCallback(() => {
    if (queueRef.current.length === 0) return;
    if (queueRef.current.length === 1) runPreviewSingle();
    else runPreviewAll();
  }, [runPreviewSingle, runPreviewAll]);

  const finishOneSuccess = useCallback(() => {
    setModalOpen(false);
    setConflicts(null);
    setMsg(copy.successEnroll);
    setQueue([]);
    setFieldResetKey((k) => k + 1);
    onEnrollSuccess?.();
  }, [copy.successEnroll, onEnrollSuccess]);

  const runEnrollSingle = useCallback(
    (dropEnrollmentId?: string | null) => {
      if (!head) return;
      setMsg(null);
      startEnroll(async () => {
        const r = await enrollStudentInSectionAction({
          locale,
          studentId: head.id,
          sectionId,
          dropSectionEnrollmentId: dropEnrollmentId ?? null,
          dropNextStatus: dropEnrollmentId ? "transferred" : undefined,
          allowCapacityOverride: capacityOverride,
        });
        if (r.ok) {
          finishOneSuccess();
          return;
        }
        const err = errors[r.code as keyof typeof errors] ?? errors.RPC;
        setMsg(err);
      });
    },
    [head, locale, sectionId, capacityOverride, errors, finishOneSuccess],
  );

  const runEnrollAll = useCallback(() => {
    const list = queueRef.current;
    if (list.length === 0) return;
    if (list.length === 1) {
      runEnrollSingle(null);
      return;
    }
    setMsg(null);
    startEnroll(async () => {
      let ok = 0;
      const failed: AdminStudentSearchHitLike[] = [];
      const failedLines: string[] = [];
      for (const s of list) {
        const r = await enrollStudentInSectionAction({
          locale,
          studentId: s.id,
          sectionId,
          dropSectionEnrollmentId: null,
          allowCapacityOverride: capacityOverride,
        });
        if (r.ok) {
          ok++;
        } else {
          failed.push(s);
          failedLines.push(errorLine(errors, r.code, s.label));
        }
      }
      setQueue(failed);
      setFieldResetKey((k) => k + 1);
      if (ok > 0) onEnrollSuccess?.();
      if (failed.length === 0) {
        setMsg(copy.bulkEnrollDoneMany.replace("{{count}}", String(ok)));
      } else if (ok === 0) {
        setMsg(
          copy.bulkEnrollFailed
            .replace("{{total}}", String(list.length))
            .replace("{{names}}", failedLines.join(" · ")),
        );
      } else {
        setMsg(
          copy.bulkEnrollPartial
            .replace("{{ok}}", String(ok))
            .replace("{{total}}", String(list.length))
            .replace("{{names}}", failedLines.join(" · ")),
        );
      }
    });
  }, [
    locale,
    sectionId,
    capacityOverride,
    errors,
    copy.bulkEnrollDoneMany,
    copy.bulkEnrollPartial,
    copy.bulkEnrollFailed,
    runEnrollSingle,
    onEnrollSuccess,
  ]);

  return {
    queue,
    addPick,
    removeId,
    fieldResetKey,
    msg,
    setMsg,
    warnParent,
    conflicts,
    targetSlots,
    modalOpen,
    setModalOpen,
    previewPending,
    enrollPending,
    busy,
    head,
    runPreview,
    runEnrollSingle,
    runEnrollAll,
  };
}

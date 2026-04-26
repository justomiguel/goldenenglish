"use client";

import { ArrowLeft, ArrowRight, Check, Replace, X } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { AcademicSearchableSelect } from "@/components/molecules/AcademicSearchableSelect";
import { rolloverEnrollStudentsAction } from "@/app/[locale]/dashboard/admin/academics/actions";
import {
  listActiveStudentsInSectionForAdmin,
  type SectionStudentPick,
} from "@/app/[locale]/dashboard/admin/academic/cohortActions";

export interface AcademicRolloverWizardDict {
  openButton: string;
  title: string;
  step1Title: string;
  step2Title: string;
  step3Title: string;
  sourceSection: string;
  targetSection: string;
  next: string;
  back: string;
  confirm: string;
  cancel: string;
  close: string;
  error: string;
  success: string;
  emptyStudents: string;
  loadingStudents: string;
  filterPlaceholder: string;
}

export interface AcademicRolloverWizardProps {
  locale: string;
  cohortId: string;
  dict: AcademicRolloverWizardDict;
  sourceSectionOptions: { id: string; name: string }[];
  targetSectionOptions: { id: string; label: string }[];
}

export function AcademicRolloverWizard({
  locale,
  dict,
  sourceSectionOptions,
  targetSectionOptions,
}: AcademicRolloverWizardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [sourceSectionId, setSourceSectionId] = useState(sourceSectionOptions[0]?.id ?? "");
  const [targetSectionId, setTargetSectionId] = useState(targetSectionOptions[0]?.id ?? "");
  const [students, setStudents] = useState<SectionStudentPick[]>([]);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [loadingStudents, setLoadingStudents] = useState(false);

  const sourceComboOptions = useMemo(
    () => sourceSectionOptions.map((s) => ({ id: s.id, label: s.name })),
    [sourceSectionOptions],
  );

  useEffect(() => {
    if (!open || step !== 3 || !sourceSectionId) return;
    let cancelled = false;
    void (async () => {
      setLoadingStudents(true);
      const rows = await listActiveStudentsInSectionForAdmin(sourceSectionId);
      if (!cancelled) {
        setStudents(rows);
        setPicked(Object.fromEntries(rows.map((r) => [r.studentId, true])));
      }
      if (!cancelled) setLoadingStudents(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, step, sourceSectionId]);

  const selectedIds = useMemo(
    () => students.filter((s) => picked[s.studentId]).map((s) => s.studentId),
    [students, picked],
  );

  const reset = () => {
    setStep(1);
    setMsg(null);
    setStudents([]);
    setPicked({});
  };

  const runRollover = () => {
    setMsg(null);
    start(async () => {
      const r = await rolloverEnrollStudentsAction({
        locale,
        sourceSectionId,
        targetSectionId,
        studentIds: selectedIds,
        allowCapacityOverride: true,
      });
      if (!r.ok) {
        setMsg(dict.error);
        return;
      }
      setMsg(dict.success.replace("{n}", String(r.enrolled)));
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 900);
    });
  };

  return (
    <>
      <Button type="button" variant="ghost" onClick={() => setOpen(true)}>
        <Replace className="h-4 w-4 shrink-0" aria-hidden />
        {dict.openButton}
      </Button>
      <Modal
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) reset();
        }}
        titleId="rollover-title"
        title={dict.title}
        disableClose={pending}
      >
        {step === 1 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.step1Title}</p>
            <AcademicSearchableSelect
              id="rw-src"
              label={dict.sourceSection}
              filterPlaceholder={dict.filterPlaceholder}
              options={sourceComboOptions}
              value={sourceSectionId}
              onChange={setSourceSectionId}
              disabled={pending}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                <X className="h-4 w-4 shrink-0" aria-hidden />
                {dict.cancel}
              </Button>
              <Button type="button" onClick={() => setStep(2)} disabled={!sourceSectionId}>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                {dict.next}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.step2Title}</p>
            <AcademicSearchableSelect
              id="rw-tgt"
              label={dict.targetSection}
              filterPlaceholder={dict.filterPlaceholder}
              options={targetSectionOptions}
              value={targetSectionId}
              onChange={setTargetSectionId}
              disabled={pending}
            />
            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={pending}>
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                {dict.back}
              </Button>
              <Button type="button" onClick={() => setStep(3)} disabled={pending || !targetSectionId}>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                {dict.next}
              </Button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <p className="text-sm font-medium">{dict.step3Title}</p>
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] p-2">
              {loadingStudents ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">{dict.loadingStudents}</p>
              ) : students.length === 0 ? (
                <p className="text-sm text-[var(--color-muted-foreground)]">{dict.emptyStudents}</p>
              ) : (
                students.map((s) => (
                  <label key={s.studentId} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(picked[s.studentId])}
                      onChange={(e) =>
                        setPicked((prev) => ({ ...prev, [s.studentId]: e.target.checked }))
                      }
                    />
                    <span className="truncate">{s.label}</span>
                  </label>
                ))
              )}
            </div>
            {msg ? <p className="text-sm text-[var(--color-foreground)]">{msg}</p> : null}
            <div className="flex justify-between gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setStep(2)} disabled={pending}>
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                {dict.back}
              </Button>
              <Button
                type="button"
                isLoading={pending}
                onClick={runRollover}
                disabled={pending || selectedIds.length === 0}
              >
                {!pending ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                {dict.confirm}
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

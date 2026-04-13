"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import type { SectionEnrollmentConflict, SectionScheduleSlot } from "@/types/academics";
import { Button } from "@/components/atoms/Button";
import {
  enrollStudentInSectionAction,
  previewSectionEnrollmentAction,
  searchAdminStudentsAction,
} from "@/app/[locale]/dashboard/admin/academics/actions";
import type { AdminStudentSearchHit } from "@/app/[locale]/dashboard/admin/academic/cohortActions";
import { ScheduleConflictResolutionModal } from "@/components/molecules/ScheduleConflictResolutionModal";

export interface AcademicSectionEnrollCardProps {
  locale: string;
  sectionId: string;
  sectionLabel: string;
  dict: Dictionary["dashboard"]["academicSectionPage"];
  conflictDict: Dictionary["dashboard"]["academics"]["conflictModal"];
  errors: Dictionary["dashboard"]["academics"]["errors"];
}

export function AcademicSectionEnrollCard({
  locale,
  sectionId,
  sectionLabel,
  dict,
  conflictDict,
  errors,
}: AcademicSectionEnrollCardProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<AdminStudentSearchHit[]>([]);
  const [picked, setPicked] = useState<AdminStudentSearchHit | null>(null);
  const [capacityOverride, setCapacityOverride] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<SectionEnrollmentConflict[] | null>(null);
  const [targetSlots, setTargetSlots] = useState<SectionScheduleSlot[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, start] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = window.setTimeout(() => {
      void (async () => {
        const r = await searchAdminStudentsAction(query.trim());
        setHits(r);
      })();
    }, 280);
    return () => window.clearTimeout(t);
  }, [query]);

  const displayHits = query.trim().length < 2 ? [] : hits;

  const runPreview = () => {
    if (!picked) return;
    setMsg(null);
    setConflicts(null);
    start(async () => {
      const r = await previewSectionEnrollmentAction({
        studentId: picked.id,
        sectionId,
        allowCapacityOverride: capacityOverride,
      });
      if (r.ok) {
        setMsg(dict.previewOk);
        return;
      }
      if (r.code === "SCHEDULE_OVERLAP" && r.conflicts?.length && r.targetSlots) {
        setConflicts(r.conflicts);
        setTargetSlots(r.targetSlots);
        setModalOpen(true);
        return;
      }
      const err = errors[r.code as keyof typeof errors] ?? errors.RPC;
      setMsg(err);
    });
  };

  const runEnroll = (dropEnrollmentId?: string | null) => {
    if (!picked) return;
    setMsg(null);
    start(async () => {
      const r = await enrollStudentInSectionAction({
        locale,
        studentId: picked.id,
        sectionId,
        dropSectionEnrollmentId: dropEnrollmentId ?? null,
        dropNextStatus: dropEnrollmentId ? "transferred" : undefined,
        allowCapacityOverride: capacityOverride,
      });
      if (r.ok) {
        setModalOpen(false);
        setConflicts(null);
        setMsg(dict.successEnroll);
        setPicked(null);
        setQuery("");
        setHits([]);
        router.refresh();
        return;
      }
      const err = errors[r.code as keyof typeof errors] ?? errors.RPC;
      setMsg(err);
    });
  };

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.enrollTitle}</h2>
      <div className="mt-3 space-y-3">
        <div>
          <label className="text-sm font-medium" htmlFor="ase-q">
            {dict.searchPlaceholder}
          </label>
          <input
            id="ase-q"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            disabled={busy}
          />
          {query.trim().length > 0 && query.trim().length < 2 ? (
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.searchMin}</p>
          ) : null}
          {displayHits.length > 0 ? (
            <ul className="mt-2 max-h-40 overflow-y-auto rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-sm">
              {displayHits.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2 text-left hover:bg-[var(--color-muted)]"
                    onClick={() => {
                      setPicked(h);
                      setQuery(h.label);
                      setHits([]);
                    }}
                  >
                    {h.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={capacityOverride}
            onChange={(e) => setCapacityOverride(e.target.checked)}
            disabled={busy}
          />
          {dict.capacityOverride}
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" disabled={busy || !picked} onClick={runPreview}>
            {dict.preview}
          </Button>
          <Button type="button" disabled={busy || !picked} onClick={() => runEnroll(null)}>
            {dict.enroll}
          </Button>
        </div>
        {msg ? <p className="text-sm text-[var(--color-foreground)]">{msg}</p> : null}
      </div>
      <ScheduleConflictResolutionModal
        open={modalOpen && Boolean(conflicts?.length)}
        onClose={() => setModalOpen(false)}
        locale={locale}
        dict={conflictDict}
        conflicts={conflicts ?? []}
        targetSlots={targetSlots}
        targetSectionLabel={sectionLabel}
        onConfirmDrop={(enrollmentId) => runEnroll(enrollmentId)}
        isPending={busy}
      />
    </section>
  );
}

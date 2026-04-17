"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { SectionScheduleFields } from "@/components/molecules/SectionScheduleFields";
import { updateAcademicSectionScheduleAction } from "@/app/[locale]/dashboard/admin/academic/sectionActions";
import {
  sectionScheduleDraftsToSlots,
  sectionScheduleSlotsToDrafts,
  type SectionScheduleSlotDraft,
} from "@/lib/academics/sectionScheduleDrafts";
import type { SectionScheduleSlot } from "@/types/academics";

export interface AcademicSectionScheduleEditorDict {
  scheduleTitle: string;
  scheduleHint: string;
  scheduleAddSlot: string;
  scheduleRemoveSlot: string;
  scheduleDayLabel: string;
  scheduleStartLabel: string;
  scheduleEndLabel: string;
  scheduleInvalid: string;
  saveSchedule: string;
  saveScheduleError: string;
  weekdays: {
    sun: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
  };
}

export interface AcademicSectionScheduleEditorProps {
  locale: string;
  sectionId: string;
  initialSlots: SectionScheduleSlot[];
  dict: AcademicSectionScheduleEditorDict;
}

export function AcademicSectionScheduleEditor({
  locale,
  sectionId,
  initialSlots,
  dict,
}: AcademicSectionScheduleEditorProps) {
  const router = useRouter();
  const [rows, setRows] = useState<SectionScheduleSlotDraft[]>(
    sectionScheduleSlotsToDrafts(initialSlots),
  );
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const save = () => {
    setErr(null);
    const scheduleSlots = sectionScheduleDraftsToSlots(rows);
    if (!scheduleSlots) {
      setErr(dict.scheduleInvalid);
      return;
    }

    start(async () => {
      const result = await updateAcademicSectionScheduleAction({
        locale,
        sectionId,
        scheduleSlots,
      });
      if (!result.ok) {
        setErr(dict.saveScheduleError);
        return;
      }
      router.refresh();
    });
  };

  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.scheduleTitle}</h2>
      <SectionScheduleFields rows={rows} onChange={setRows} dict={dict} disabled={pending} />
      {err ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {err}
        </p>
      ) : null}
      <div className="flex justify-end">
        <Button
          type="button"
          className="min-h-[44px]"
          isLoading={pending}
          disabled={pending}
          onClick={save}
        >
          {dict.saveSchedule}
        </Button>
      </div>
    </section>
  );
}

"use client";

import {
  AcademicSectionWeekScheduleEditor,
  type AcademicSectionWeekScheduleEditorDict,
} from "@/components/organisms/AcademicSectionWeekScheduleEditor";
import type { SectionScheduleSlot } from "@/types/academics";

export type AcademicSectionScheduleEditorDict = AcademicSectionWeekScheduleEditorDict;

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
  return (
    <AcademicSectionWeekScheduleEditor
      locale={locale}
      sectionId={sectionId}
      initialSlots={initialSlots}
      dict={dict}
    />
  );
}

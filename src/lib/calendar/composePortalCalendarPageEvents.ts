import {
  expandExamOccurrences,
  expandSectionClassOccurrences,
  mapSpecialCalendarRowsToExpanded,
  mergeAndSortOccurrences,
  type ExamOccurrenceInput,
  type SectionOccurrenceInput,
  type SpecialCalendarEventRow,
} from "@/lib/calendar/expandPortalCalendarOccurrences";

export function composePortalCalendarPageEvents(
  sections: SectionOccurrenceInput[],
  exams: ExamOccurrenceInput[],
  specialRows: SpecialCalendarEventRow[],
  viewStartIso: string,
  viewEndIso: string,
) {
  return mergeAndSortOccurrences([
    expandSectionClassOccurrences(sections, viewStartIso, viewEndIso),
    expandExamOccurrences(exams, viewStartIso, viewEndIso),
    mapSpecialCalendarRowsToExpanded(specialRows),
  ]);
}

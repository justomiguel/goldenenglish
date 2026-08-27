import { sectionScheduleWeekdayKey } from "@/lib/academics/sectionScheduleWeekdayKey";
import { buildSectionEnrollmentLinkPath } from "@/lib/register/sectionEnrollmentLinkPath";
import { SECTION_SHARE_FALLBACK_PATH } from "@/lib/register/sectionReferenceImage";
import type { SectionScheduleSlot } from "@/types/academics";

export interface SectionEnrollmentLinkShareWeekdays {
  sun: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
}

export function buildSectionEnrollmentLinkShareMetadata(input: {
  locale: string;
  brandName: string;
  sectionName: string;
  token: string;
  cohortName: string;
  scheduleSlots: SectionScheduleSlot[];
  weekdays: SectionEnrollmentLinkShareWeekdays;
  referenceImagePublicUrl: string | null;
}): {
  title: string;
  description: string;
  path: string;
  coverImageUrl: string;
} {
  const schedule = input.scheduleSlots
    .map((slot) => {
      const day = input.weekdays[sectionScheduleWeekdayKey(slot.dayOfWeek)];
      return `${day} ${slot.startTime}–${slot.endTime}`;
    })
    .join(", ");
  const parts = [input.cohortName.trim(), schedule].filter((p) => p.length > 0);
  return {
    title: `${input.sectionName} · ${input.brandName}`,
    description: parts.join(" · "),
    path: buildSectionEnrollmentLinkPath(input.locale, input.sectionName, input.token),
    coverImageUrl: input.referenceImagePublicUrl ?? SECTION_SHARE_FALLBACK_PATH,
  };
}

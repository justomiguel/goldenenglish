import {
  isMzGuideAgeBand,
  isMzGuideAttendance,
  isMzGuideChoice,
  type MzGuideAgeBand,
  type MzGuideAttendance,
  type MzGuideChoice,
} from "@/lib/landing/mozarthitos/familyGuideCatalog";
import type { RegisterIntent } from "@/lib/settings/resolveRegisterIntent";

export const MZ_GUIDE_PATH = "encuentra-tu-clase";
/** Query keys on the guide page. */
export const MZ_GUIDE_AGE_PARAM = "edad";
export const MZ_GUIDE_ATTENDANCE_PARAM = "modalidad";
/** Query key on `/register` and hidden form field name. */
export const MZ_GUIDE_REGISTER_PARAM = "guide";
export const MZ_GUIDE_FORM_FIELD = "mz_guide";

export function formatGuideToken(choice: MzGuideChoice): string {
  return `${choice.stage}.${choice.modality}.${choice.ageBand}`;
}

/** Strict allow-list parse. Anything else returns `null`. */
export function parseGuideToken(raw: unknown): MzGuideChoice | null {
  if (typeof raw !== "string" || raw.length > 64) return null;
  const parts = raw.trim().split(".");
  if (parts.length !== 3) return null;
  const [stage, modality, ageBand] = parts;
  const candidate = { stage, modality, ageBand };
  return isMzGuideChoice(candidate) ? candidate : null;
}

export function buildGuideRegisterHref(
  locale: string,
  intent: RegisterIntent,
  choice: MzGuideChoice,
): string {
  const params = new URLSearchParams({ intent, [MZ_GUIDE_REGISTER_PARAM]: formatGuideToken(choice) });
  return `/${locale}/register?${params.toString()}`;
}

export function buildGuidePageHref(
  locale: string,
  answers?: { attendance?: MzGuideAttendance },
): string {
  const base = `/${locale}/${MZ_GUIDE_PATH}`;
  return answers?.attendance ? `${base}?${MZ_GUIDE_ATTENDANCE_PARAM}=${answers.attendance}` : base;
}

export function readGuideAnswers(query: Record<string, string | string[] | undefined>): {
  ageBand: MzGuideAgeBand | null;
  attendance: MzGuideAttendance | null;
} {
  const age = query[MZ_GUIDE_AGE_PARAM];
  const attendance = query[MZ_GUIDE_ATTENDANCE_PARAM];
  return {
    ageBand: isMzGuideAgeBand(age) ? age : null,
    attendance: isMzGuideAttendance(attendance) ? attendance : null,
  };
}

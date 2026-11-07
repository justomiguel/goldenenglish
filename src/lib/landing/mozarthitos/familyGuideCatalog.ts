/**
 * Mozarthitos family guide catalog. Ids are stable: they are stored on
 * `registrations.tenant_extras.guide` and used as dictionary keys.
 */
export const MZ_GUIDE_AGE_BANDS = [
  "under_6m",
  "6m_2y",
  "3y_4y",
  "5y_7y",
  "8y_plus",
  "adult",
] as const;
export type MzGuideAgeBand = (typeof MZ_GUIDE_AGE_BANDS)[number];

export const MZ_GUIDE_ATTENDANCE = ["in_person", "remote", "unsure"] as const;
export type MzGuideAttendance = (typeof MZ_GUIDE_ATTENDANCE)[number];

export const MZ_GUIDE_STAGES = [
  "baby_mago",
  "little_musicians",
  "instrument",
  "adult_choir",
] as const;
export type MzGuideStage = (typeof MZ_GUIDE_STAGES)[number];

/** Offer a family can book from the guide. */
export const MZ_GUIDE_MODALITIES = ["in_person", "live_online", "pack"] as const;
export type MzGuideModality = (typeof MZ_GUIDE_MODALITIES)[number];

/** A result card: a bookable modality, or "contact" when no remote offer exists yet. */
export type MzGuideOffer = MzGuideModality | "contact";

export interface MzGuideChoice {
  stage: MzGuideStage;
  modality: MzGuideModality;
  ageBand: MzGuideAgeBand;
}

export const MZ_GUIDE_STAGE_MODALITIES: Readonly<
  Record<MzGuideStage, ReadonlyArray<MzGuideModality>>
> = {
  baby_mago: ["in_person", "live_online", "pack"],
  little_musicians: ["in_person", "live_online", "pack"],
  instrument: ["in_person"],
  adult_choir: ["in_person"],
};

export function isMzGuideAgeBand(value: unknown): value is MzGuideAgeBand {
  return typeof value === "string" && (MZ_GUIDE_AGE_BANDS as readonly string[]).includes(value);
}

export function isMzGuideAttendance(value: unknown): value is MzGuideAttendance {
  return typeof value === "string" && (MZ_GUIDE_ATTENDANCE as readonly string[]).includes(value);
}

export function isMzGuideStage(value: unknown): value is MzGuideStage {
  return typeof value === "string" && (MZ_GUIDE_STAGES as readonly string[]).includes(value);
}

export function isMzGuideModality(value: unknown): value is MzGuideModality {
  return typeof value === "string" && (MZ_GUIDE_MODALITIES as readonly string[]).includes(value);
}

export function isMzGuideChoice(value: {
  stage: unknown;
  modality: unknown;
  ageBand: unknown;
}): value is MzGuideChoice {
  return (
    isMzGuideStage(value.stage) &&
    isMzGuideModality(value.modality) &&
    isMzGuideAgeBand(value.ageBand) &&
    MZ_GUIDE_STAGE_MODALITIES[value.stage].includes(value.modality)
  );
}

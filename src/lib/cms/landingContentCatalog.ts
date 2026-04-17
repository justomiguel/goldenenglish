import type { LandingSectionSlug } from "@/types/theming";

/**
 * Closed catalog of editable landing copy per section.
 *
 * Drives both the admin editor (which fields render) and the runtime
 * resolver (which dictionary paths can be overridden). Keeping the list
 * closed means a future copy refactor cannot accidentally make new dict
 * paths editable without an explicit code change.
 *
 * Paths are dot-separated and resolved relative to `dict.landing.*`.
 * Only **scalar string** keys are eligible — arrays (`collage.alts`,
 * `studentGallery.items`) and structural data stay in the dictionaries.
 */
export type LandingCopyKey = string;

export const LANDING_COPY_KEYS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, ReadonlyArray<LandingCopyKey>>
> = {
  inicio: [
    "hero.kicker",
    "hero.ctaRegister",
    "hero.ctaSignedIn",
    "hero.whatsappCta",
  ],
  historia: ["story.title", "story.body1", "story.body2"],
  modalidades: [
    "modalities.title",
    "modalities.intro",
    "modalities.audiencesTitle",
    "modalities.kids",
    "modalities.teens",
    "modalities.adults",
    "modalities.presencial.title",
    "modalities.presencial.lead",
    "modalities.presencial.b1",
    "modalities.presencial.b2",
    "modalities.presencial.b3",
    "modalities.remota.title",
    "modalities.remota.lead",
    "modalities.remota.b1",
    "modalities.remota.b2",
    "modalities.remota.b3",
  ],
  niveles: [
    "levels.title",
    "levels.introLead",
    "levels.introEmphasis",
    "levels.introTrail",
    "levels.beginner",
    "levels.intermediate",
    "levels.advanced",
    "levels.a1",
    "levels.a2",
    "levels.b1",
    "levels.b2",
    "levels.c1",
    "levels.c2",
  ],
  certificaciones: [
    "certs.title",
    "certs.cardInstitutional",
    "certs.cardNational",
    "certs.cardInternational",
    "certs.edu",
    "certs.utn",
    "certs.cambridge",
  ],
  oferta: ["footerCta"],
};

const ALL_KEYS: ReadonlySet<string> = new Set(
  Object.values(LANDING_COPY_KEYS_BY_SECTION).flat(),
);

/** Whether a dotted dict path under `landing.*` is editable from the CMS. */
export function isEditableLandingCopyKey(path: string): boolean {
  return ALL_KEYS.has(path);
}

/** How many media slots an admin can manage per section. Mirrors the in-code
 *  layouts of the landing organisms today; uploading more would not render. */
export const LANDING_MEDIA_SLOTS_BY_SECTION: Readonly<
  Record<LandingSectionSlug, number>
> = {
  inicio: 3,
  historia: 2,
  modalidades: 4,
  niveles: 0,
  certificaciones: 0,
  oferta: 0,
};

/** Closed catalog of locales that can carry overrides. Mirrors `Locale`. */
export const LANDING_OVERRIDE_LOCALES = ["es", "en"] as const;
export type LandingOverrideLocale = (typeof LANDING_OVERRIDE_LOCALES)[number];

export function isLandingOverrideLocale(
  candidate: string,
): candidate is LandingOverrideLocale {
  return (LANDING_OVERRIDE_LOCALES as ReadonlyArray<string>).includes(
    candidate,
  );
}

import type { LandingCopyFieldDescriptor } from "@/lib/cms/buildLandingEditorViewModel";
import type { LandingOverrideLocale } from "@/lib/cms/landingContentCatalog";

export type LandingCopyDraft = Record<
  string,
  Record<LandingOverrideLocale, string>
>;

/**
 * Builds the initial editing draft from the loaded view model. We keep the
 * raw text the editor typed so far (no defaults injected): empty strings mean
 * "use the dictionary default" once persisted via the cleaning helper.
 */
export function buildInitialLandingCopyDraft(
  fields: ReadonlyArray<LandingCopyFieldDescriptor>,
): LandingCopyDraft {
  const draft: LandingCopyDraft = {};
  for (const field of fields) {
    draft[field.key] = {
      es: field.overrides.es ?? "",
      en: field.overrides.en ?? "",
      pt: field.overrides.pt ?? "",
    };
  }
  return draft;
}

export function isLandingCopyDraftDirty(
  fields: ReadonlyArray<LandingCopyFieldDescriptor>,
  draft: LandingCopyDraft,
): boolean {
  for (const field of fields) {
    const slot = draft[field.key];
    if (!slot) continue;
    const initialEs = field.overrides.es ?? "";
    const initialEn = field.overrides.en ?? "";
    const initialPt = field.overrides.pt ?? "";
    if (
      slot.es !== initialEs ||
      slot.en !== initialEn ||
      slot.pt !== initialPt
    )
      return true;
  }
  return false;
}

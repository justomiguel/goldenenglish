import { suggestDuplicatedThemeSlug } from "@/lib/cms/normalizeThemeSlug";
import type { SiteThemeRow } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeTemplateNameDialogLabels } from "./SiteThemeTemplateNameDialog";

type Labels = Dictionary["admin"]["cms"]["templates"];
export type SiteThemeDialogKind = "create" | "rename" | "duplicate" | null;

export function buildDialogLabels(
  kind: SiteThemeDialogKind,
  labels: Labels,
): SiteThemeTemplateNameDialogLabels {
  if (kind === "create") {
    return {
      title: labels.createDialogTitle,
      lead: labels.createDialogLead,
      fieldName: labels.fieldName,
      fieldSlug: labels.fieldSlug,
      fieldSlugHint: labels.fieldSlugHint,
      fieldActivateNow: labels.fieldActivateNow,
      submit: labels.submitCreate,
    };
  }
  if (kind === "rename") {
    return {
      title: labels.renameDialogTitle,
      fieldName: labels.fieldName,
      fieldSlug: labels.fieldSlug,
      fieldSlugHint: labels.fieldSlugHint,
      submit: labels.submitRename,
    };
  }
  return {
    title: labels.duplicateDialogTitle,
    lead: labels.duplicateDialogLead,
    fieldName: labels.fieldName,
    fieldSlug: labels.fieldSlug,
    fieldSlugHint: labels.fieldSlugHint,
    submit: labels.submitDuplicate,
  };
}

export interface DialogInitialValues {
  initialName: string;
  initialSlug: string;
}

export function buildDialogInitialValues(
  kind: SiteThemeDialogKind,
  target: SiteThemeRow | undefined,
  existingSlugs: ReadonlySet<string>,
): DialogInitialValues {
  if (kind === "rename" && target) {
    return { initialName: target.name, initialSlug: target.slug };
  }
  if (kind === "duplicate" && target) {
    return {
      initialName: target.name,
      initialSlug: suggestDuplicatedThemeSlug(target.slug, existingSlugs),
    };
  }
  return { initialName: "", initialSlug: "" };
}

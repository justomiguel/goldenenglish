import { getLandingDefaultCopy } from "@/lib/cms/applyLandingContentOverrides";
import { genericLandingCopyKeys } from "@/lib/cms/genericLandingCopyKeys";
import type { LandingOverrideLocale } from "@/lib/cms/landingContentCatalog";
import { isGenericInstituteKind, type GenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import type { Dictionary } from "@/types/i18n";
import type { LandingSectionSlug, SiteThemeContent } from "@/types/theming";
import { LANDING_SECTION_SLUGS } from "@/types/theming";

const WITH_TEAM = new Set(["deportes2", "jardin2", "colegio2", "idiomas2", "musica2"]);

const SECTION_ORDER = [
  "inicio",
  "historia",
  "oferta",
  "modalidades",
  "niveles",
  "equipo",
  "certificaciones",
  "contacto",
] as const;

type CopySection = (typeof SECTION_ORDER)[number];

export interface GenericSiteCopyField {
  key: string;
  section: LandingSectionSlug;
  group: CopySection;
  label: string;
  value: string;
  multiline: boolean;
  required: boolean;
}

type CopyLabels = Dictionary["pulsar"]["account"]["siteCopy"];

export function buildGenericSiteCopyFields(args: {
  kind: GenericInstituteKind;
  dict: Dictionary;
  content: SiteThemeContent | null | undefined;
  locale: LandingOverrideLocale;
  labels: CopyLabels;
}): GenericSiteCopyField[] {
  const names = args.dict.landing.genericSectionLabels;
  const landing = `genericLandings.${args.kind}`;
  const rows: Array<Omit<GenericSiteCopyField, "value"> & { value?: string }> = [];
  const push = (
    group: CopySection,
    key: string,
    section: LandingSectionSlug,
    label: string,
    multiline: boolean,
    required = false,
  ) => {
    rows.push({ key, section, group, label, multiline, required });
  };

  for (const group of SECTION_ORDER) {
    if (group === "equipo" && !WITH_TEAM.has(args.kind)) continue;
    const nameKey =
      group === "historia" || group === "oferta" || group === "modalidades" || group === "niveles" || group === "certificaciones"
        ? `genericSectionLabels.${group}`
        : `genericSectionLabels.${group}`;
    const nameSection: LandingSectionSlug =
      group === "historia" || group === "oferta" || group === "modalidades" || group === "niveles" || group === "certificaciones"
        ? group
        : "inicio";
    push(group, nameKey, nameSection, args.labels.name, false, true);
    if (group === "inicio") {
      push(group, `${landing}.scene`, "inicio", args.labels.scene, false);
      push(group, `${landing}.title`, "inicio", args.labels.headline, false);
      push(group, `${landing}.body`, "inicio", args.labels.body, true);
      push(group, `${landing}.cta`, "inicio", args.labels.button, false);
      push(group, `${landing}.imageAlt`, "inicio", args.labels.photo, false);
      push(group, `${landing}.rhythmA`, "inicio", args.labels.day, false);
      push(group, `${landing}.rhythmB`, "inicio", args.labels.day, false);
      push(group, `${landing}.rhythmC`, "inicio", args.labels.day, false);
    } else if (group !== "equipo" && group !== "contacto") {
      push(group, `${landing}.sections.${group}`, group, args.labels.body, true);
    }
    if (group === "certificaciones") {
      push(group, `${landing}.laterTitle`, "inicio", args.labels.closeTitle, false);
      push(group, `${landing}.laterBody`, "inicio", args.labels.closeBody, true);
    }
  }

  return rows.map((row) => ({
    ...row,
    value: readCopy(args.content, row.key, args.locale) || getLandingDefaultCopy(args.dict, row.key),
    label: row.required ? `${names[row.group] || row.group} — ${row.label}` : row.label,
  }));
}

export function allowedGenericCopyKeys(kind: GenericInstituteKind): Set<string> {
  const keys = new Set<string>();
  for (const section of LANDING_SECTION_SLUGS) {
    for (const key of genericLandingCopyKeys(kind, section)) keys.add(key);
  }
  return keys;
}

export function genericCopyKind(kind: string): GenericInstituteKind | null {
  return isGenericInstituteKind(kind) ? kind : null;
}

function readCopy(
  content: SiteThemeContent | null | undefined,
  key: string,
  locale: LandingOverrideLocale,
): string {
  for (const section of LANDING_SECTION_SLUGS) {
    const value = content?.[section]?.[key]?.[locale];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

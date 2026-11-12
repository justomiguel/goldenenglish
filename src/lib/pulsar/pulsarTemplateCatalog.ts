import {
  GENERIC_INSTITUTE_KINDS,
  genericKindDefaultPalette,
  genericPreviewSrc,
  type GenericInstituteKind,
} from "@/lib/theme/genericInstituteTemplates";
import { templatePreviewHref } from "@/lib/theme/templatePalette";

export type PulsarTemplateCatalogCard = {
  kind: GenericInstituteKind;
  name: string;
  src: string;
  href: string;
  openLabel: string;
  applyHref?: string;
  applyLabel?: string;
};

export function buildPulsarTemplateCatalogCards(input: {
  locale: string;
  names: Record<GenericInstituteKind, string>;
  openLabel: string;
  applyLabel?: string;
}): PulsarTemplateCatalogCard[] {
  return GENERIC_INSTITUTE_KINDS.map((kind) => {
    const name = input.names[kind];
    return {
      kind,
      name,
      src: genericPreviewSrc(kind),
      href: templatePreviewHref(input.locale, kind, genericKindDefaultPalette(kind)),
      openLabel: input.openLabel.replaceAll("{name}", name),
      applyHref: input.applyLabel ? `/${input.locale}/admin/tenants/new?starter=${kind}` : undefined,
      applyLabel: input.applyLabel?.replaceAll("{name}", name),
    };
  });
}

import type { TemplateSectionId } from "@/lib/landing/templateSections";
import { TEMPLATE_SECTION_IDS } from "@/lib/landing/templateSections";
import type { Dictionary } from "@/types/i18n";

/** Menu and heading use one name. A saved label wins. The short nav word is the fallback. */
export function genericSectionNames(
  dict: Dictionary,
): Record<TemplateSectionId, string> {
  const labels = dict.landing.genericSectionLabels;
  const nav = dict.landing.templateNav;
  return {
    inicio: labels.inicio || nav.inicio,
    historia: labels.historia || nav.historia,
    oferta: labels.oferta || nav.oferta,
    modalidades: labels.modalidades || nav.modalidades,
    niveles: labels.niveles || nav.niveles,
    equipo: labels.equipo || nav.equipo,
    certificaciones: labels.certificaciones || nav.certificaciones,
    contacto: labels.contacto || nav.contacto,
  };
}

export function genericSectionNameList(dict: Dictionary): Array<[TemplateSectionId, string]> {
  const names = genericSectionNames(dict);
  return TEMPLATE_SECTION_IDS.map((id) => [id, names[id]]);
}

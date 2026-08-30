import type { Dictionary } from "@/types/i18n";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";

export function nagoSiteHeaderLabels(dict: Dictionary) {
  const t = (path: string) => marketingLandingCopy(dict, "nago", path);
  return {
    inicio: t("nav.inicio"),
    clases: t("nav.clases"),
    horarios: t("nav.horarios"),
    nago: t("nav.nago"),
    galeria: t("nav.galeria"),
    eventos: t("nav.eventos"),
    contacto: t("nav.contacto"),
    agendaCta: t("nav.agendaCta"),
    openMenu: t("chrome.openMenu"),
    closeMenu: t("chrome.closeMenu"),
  };
}

export type NagoSiteHeaderLabels = ReturnType<typeof nagoSiteHeaderLabels>;

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type VariantView = ComponentType<Record<string, unknown>>;

function load(loader: () => Promise<{ default: ComponentType<never> }>): VariantView {
  return dynamic(loader as () => Promise<{ default: VariantView }>) as VariantView;
}

export const MATISS_CLIENT_ENTRIES: Record<string, { web: VariantView; pwa: VariantView }> = {
  "nav.matiss@1": {
    web: load(() => import("@/variants/owned/matiss/header/v1/Web")),
    pwa: load(() => import("@/variants/owned/matiss/header/v1/Pwa")),
  },
  "schedule.matiss-age@1": {
    web: load(() => import("@/variants/owned/matiss/age/v1/Web")),
    pwa: load(() => import("@/variants/owned/matiss/age/v1/Pwa")),
  },
  "band.matiss-gallery@1": {
    web: load(() => import("@/variants/owned/matiss/gallery/v1/Web")),
    pwa: load(() => import("@/variants/owned/matiss/gallery/v1/Pwa")),
  },
  "faq.matiss-phone@1": {
    web: load(() => import("@/variants/owned/matiss/faq-phone/v1/Web")),
    pwa: load(() => import("@/variants/owned/matiss/faq-phone/v1/Pwa")),
  },
  "contact.matiss@1": {
    web: load(() => import("@/variants/owned/matiss/contact/v1/Web")),
    pwa: load(() => import("@/variants/owned/matiss/contact/v1/Pwa")),
  },
  "page.matiss-home@1": {
    web: load(() => import("@/variants/owned/matiss/home/v1/Web")),
    pwa: load(() => import("@/variants/owned/matiss/home/v1/Pwa")),
  },
  "page.matiss-register@1": {
    web: load(() => import("@/variants/owned/matiss/register/v1/Web")),
    pwa: load(() => import("@/variants/owned/matiss/register/v1/Pwa")),
  },
  "page.matiss-contact@1": {
    web: load(() => import("@/variants/owned/matiss/contact-page/v1/Web")),
    pwa: load(() => import("@/variants/owned/matiss/contact-page/v1/Pwa")),
  },
};

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { ESPACIOZENIT_CLIENT_ENTRIES } from "@/variants/owned/espaciozenit/clientEntries";
import { NAGO_CLIENT_ENTRIES } from "@/variants/owned/nago/clientEntries";
import { LIORA_CLIENT_ENTRIES } from "@/variants/owned/liora/clientEntries";
import { MATISS_CLIENT_ENTRIES } from "@/variants/owned/matiss/clientEntries";
import { MIMUNDO_CLIENT_ENTRIES } from "@/variants/owned/mimundo/clientEntries";
import { MOZARTHITOS_CLIENT_ENTRIES } from "@/variants/owned/mozarthitos/clientEntries";

type VariantView = ComponentType<Record<string, unknown>>;

function load(loader: () => Promise<{ default: ComponentType<never> }>): VariantView {
  return dynamic(loader as () => Promise<{ default: VariantView }>) as VariantView;
}

export const CLIENT_VARIANT_ENTRIES: Record<string, { web: VariantView; pwa: VariantView }> = {
  "nav.generic@1": {
    web: load(() => import("@/variants/nav/generic/v1/Web")),
    pwa: load(() => import("@/variants/nav/generic/v1/Pwa")),
  },
  "contact.form@1": {
    web: load(() => import("@/variants/contact/form/v1/Web")),
    pwa: load(() => import("@/variants/contact/form/v1/Pwa")),
  },
  ...MATISS_CLIENT_ENTRIES,
  ...LIORA_CLIENT_ENTRIES,
  ...MOZARTHITOS_CLIENT_ENTRIES,
  ...MIMUNDO_CLIENT_ENTRIES,
  ...ESPACIOZENIT_CLIENT_ENTRIES,
  ...NAGO_CLIENT_ENTRIES,
};

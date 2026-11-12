import dynamic from "next/dynamic";
import type { ComponentType } from "react";

type VariantView = ComponentType<Record<string, unknown>>;

function load(loader: () => Promise<{ default: ComponentType<never> }>): VariantView {
  return dynamic(loader as () => Promise<{ default: VariantView }>) as VariantView;
}

export const LIORA_CLIENT_ENTRIES: Record<string, { web: VariantView; pwa: VariantView }> = {
  "page.liora-home@1": {
    web: load(() => import("@/variants/owned/liora/home/v1/Web")),
    pwa: load(() => import("@/variants/owned/liora/home/v1/Pwa")),
  },
};

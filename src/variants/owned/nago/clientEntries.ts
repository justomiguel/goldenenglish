import type { ComponentType } from "react";

type VariantView = ComponentType<Record<string, unknown>>;

export const NAGO_CLIENT_ENTRIES: Record<string, { web: VariantView; pwa: VariantView }> = {};

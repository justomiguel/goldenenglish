"use client";

import { CLIENT_VARIANT_ENTRIES } from "@/variants/clientEntries";
import { useAppSurface } from "@/hooks/useAppSurface";

export interface VariantSurfaceEntryProps {
  variantKey: string;
  props: unknown;
}

export function VariantSurfaceEntry({ variantKey, props }: VariantSurfaceEntryProps) {
  const surface = useAppSurface();
  const entry = CLIENT_VARIANT_ENTRIES[variantKey];
  if (!entry) return null;
  const View = surface === "web-desktop" ? entry.web : entry.pwa;
  const fields = props && typeof props === "object" ? (props as Record<string, unknown>) : {};
  return (
    <div data-variant-entry={variantKey}>
      <View {...fields} />
    </div>
  );
}

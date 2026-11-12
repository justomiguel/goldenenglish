import type { DesignTokensV1 } from "@/lib/design-tokens/designTokensV1";
import { pwaShortcutPath, type PwaShortcutId } from "@/lib/pwa/pwaShortcuts";

export interface InstallIconSet {
  sizes: Record<192 | 256 | 384 | 512 | 180, string>;
}

export interface TenantManifestInput {
  name: string;
  shortName: string;
  description: string;
  locale: string;
  tokens: DesignTokensV1;
  icons: {
    any: InstallIconSet | null;
    maskable: InstallIconSet | null;
    faviconFallback: string[];
  };
  shortcuts: PwaShortcutId[];
  hasBilling: boolean;
  startUrl: string;
  labels: Record<PwaShortcutId, string>;
}

export interface TenantManifestIcon {
  src: string;
  sizes?: string;
  type?: string;
  purpose?: "any" | "maskable";
}

export interface TenantWebManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: "standalone";
  background_color: string;
  theme_color: string;
  lang: string;
  icons: TenantManifestIcon[];
  shortcuts: { name: string; url: string }[];
}

const WEB_ICON_SIZES = [192, 256, 384, 512] as const;

function iconEntries(
  set: InstallIconSet | null,
  purpose: "any" | "maskable",
): TenantManifestIcon[] {
  if (!set) return [];
  return WEB_ICON_SIZES.map((size) => ({
    src: set.sizes[size],
    sizes: `${size}x${size}`,
    type: "image/png",
    purpose,
  }));
}

export function buildTenantManifest(input: TenantManifestInput): TenantWebManifest {
  const anyIcons = iconEntries(input.icons.any, "any");
  const maskableIcons = iconEntries(input.icons.maskable, "maskable");
  const icons =
    anyIcons.length > 0 || maskableIcons.length > 0
      ? [...anyIcons, ...maskableIcons]
      : input.icons.faviconFallback.map((src) => ({ src }));
  const shortcuts = input.shortcuts
    .filter((id) => input.hasBilling || id !== "parent_payments")
    .map((id) => ({
      name: input.labels[id],
      url: pwaShortcutPath(id, input.locale),
    }));

  return {
    name: input.name,
    short_name: input.shortName,
    description: input.description,
    start_url: input.startUrl,
    display: "standalone",
    background_color: input.tokens.install?.background || input.tokens.color.background,
    theme_color: input.tokens.install?.theme || input.tokens.color.primary,
    lang: input.locale,
    icons,
    shortcuts,
  };
}

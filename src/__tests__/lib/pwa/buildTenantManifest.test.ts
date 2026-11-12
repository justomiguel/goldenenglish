import { describe, expect, it } from "vitest";
import { parseDesignTokens } from "@/lib/design-tokens/parseDesignTokens";
import { buildTenantManifest, type InstallIconSet } from "@/lib/pwa/buildTenantManifest";
import type { PwaShortcutId } from "@/lib/pwa/pwaShortcuts";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";

const labels: Record<PwaShortcutId, string> = {
  parent_payments: "Payments",
  parent_messages: "Messages",
  student_schedule: "Schedule",
  student_tasks: "Tasks",
  events: "Events",
};

function iconSet(prefix: string): InstallIconSet {
  return {
    sizes: {
      192: `${prefix}/192.png`,
      256: `${prefix}/256.png`,
      384: `${prefix}/384.png`,
      512: `${prefix}/512.png`,
      180: `${prefix}/180.png`,
    },
  };
}

function input(prefix: string, hasBilling: boolean) {
  return {
    name: prefix,
    shortName: prefix.slice(0, 12),
    description: `${prefix} tagline`,
    locale: "es",
    tokens: parseDesignTokens({
      ...SYSTEM_PROPERTIES_DEFAULTS,
      "install.theme": prefix === "nago" ? "#070707" : "#103A5C",
      "install.background": prefix === "nago" ? "#111111" : "#FAF9F6",
    }),
    icons: {
      any: iconSet(`${prefix}/any`),
      maskable: iconSet(`${prefix}/maskable`),
      faviconFallback: [`${prefix}/favicon.png`],
    },
    shortcuts: [
      "parent_payments",
      "parent_messages",
      "events",
    ] as PwaShortcutId[],
    hasBilling,
    startUrl: "/",
    labels,
  };
}

describe("buildTenantManifest", () => {
  it("reads theme and background from install tokens", () => {
    const manifest = buildTenantManifest(input("nago", true));
    expect(manifest.theme_color).toBe("#070707");
    expect(manifest.background_color).toBe("#111111");
  });

  it("lists any and maskable icons with a purpose", () => {
    const manifest = buildTenantManifest(input("nago", true));
    expect(manifest.icons.map((icon) => icon.purpose)).toEqual([
      "any",
      "any",
      "any",
      "any",
      "maskable",
      "maskable",
      "maskable",
      "maskable",
    ]);
  });

  it("uses only the favicon set when no install icon exists", () => {
    const base = input("club", true);
    const manifest = buildTenantManifest({
      ...base,
      icons: { any: null, maskable: null, faviconFallback: ["/club/favicon.png"] },
    });
    expect(manifest.icons).toEqual([{ src: "/club/favicon.png" }]);
  });

  it("drops the payment shortcut when billing is off", () => {
    const manifest = buildTenantManifest(input("club", false));
    expect(manifest.shortcuts.map((item) => item.name)).toEqual(["Messages", "Events"]);
  });

  it("uses the label text for shortcut names", () => {
    const manifest = buildTenantManifest(input("club", true));
    expect(manifest.shortcuts.map((item) => item.name)).toEqual([
      "Payments",
      "Messages",
      "Events",
    ]);
  });

  it("shares no icon URL between two tenants", () => {
    const nago = buildTenantManifest(input("nago", true));
    const club = buildTenantManifest(input("club", true));
    const nagoUrls = new Set(nago.icons.map((icon) => icon.src));
    expect(club.icons.every((icon) => !nagoUrls.has(icon.src))).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

const updateMock = vi.hoisted(() => vi.fn());
const warnMock = vi.hoisted(() => vi.fn(async () => undefined));

vi.mock("next/cache", () => ({ updateTag: vi.fn() }));
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({ recordSystemAudit: vi.fn() }));
vi.mock("@/lib/analytics/server/recordUserEvent", () => ({ recordUserEventServer: vi.fn() }));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: (...args: unknown[]) => warnMock(...args),
  logSupabaseError: vi.fn(),
}));
vi.mock("@/lib/tenant/tenantRequestContext", () => ({
  resolveRequestTenant: vi.fn(async () => ({ slug: "golden", brandThemeSlug: "golden" })),
}));
vi.mock("@/lib/site/uploadInitialSiteSetupWizardAssets", () => ({
  uploadInitialSiteSetupWizardAssets: vi.fn(async () => ({
    ok: true,
    logoPath: null,
    favPath: null,
    favUploadedPaths: [],
    faviconBundlePrefixStored: undefined,
    clearFaviconBundlePrefix: false,
  })),
  rollbackSiteSetupWizardAssets: vi.fn(async () => undefined),
}));
vi.mock("@/app/[locale]/dashboard/admin/cms/siteThemeActionShared", () => ({
  resolveAdminContext: vi.fn(async () => ({
    ok: true,
    admin: {
      user: { id: "user-1" },
      supabase: {
        from: () => ({
          update: (payload: unknown) => {
            updateMock(payload);
            return { eq: async () => ({ error: null }) };
          },
        }),
      },
    },
  })),
  fetchSiteThemeById: vi.fn(async () => ({
    id: "550e8400-e29b-41d4-a716-446655440000",
    is_active: true,
    slug: "golden",
    archived_at: null,
    template_kind: "editorial",
    properties: {},
  })),
  revalidateSiteThemeSurfaces: vi.fn(),
}));

import { completeInitialSiteSetupAction } from "@/app/[locale]/dashboard/admin/site-setup/siteSetupActions";

const base = {
  locale: "en",
  themeId: "550e8400-e29b-41d4-a716-446655440000",
  mode: "edit" as const,
  appName: "Inst",
  legalName: "Inst Legal",
  tagline: "Tag",
  logoAlt: "Alt",
  contactEmail: "a@b.co",
  contactPhone: "+5491111222333",
  contactAddress: "Addr",
  faviconKind: "none" as const,
};

describe("completeInitialSiteSetupAction design tokens", () => {
  beforeEach(() => {
    updateMock.mockReset();
    warnMock.mockClear();
  });

  it("rejects a low-contrast palette and does not write the theme", async () => {
    const result = await completeInitialSiteSetupAction({
      ...base,
      visualPrimary: "#FFFF00",
    });
    expect(result).toEqual({
      ok: false,
      code: "contrast_below_aa",
      token: "color.primary",
    });
    expect(warnMock).toHaveBeenCalledWith("siteSetup.saveVisual", {
      code: "contrast_below_aa",
      token: "color.primary",
    });
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("writes font.heading and font.body on a valid save", async () => {
    const result = await completeInitialSiteSetupAction({
      ...base,
      fontHeading: "oswald",
      fontBody: "outfit",
    });
    expect(result).toEqual({ ok: true });
    const payload = updateMock.mock.calls[0]?.[0] as { properties: Record<string, string> };
    expect(payload.properties["font.heading"]).toBe("oswald");
    expect(payload.properties["font.body"]).toBe("outfit");
  });
});

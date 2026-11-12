import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateTag, revalidatePath, assertAdmin, pulsarThemeEditorContext, getAlsTenant, publish, createThemeDocumentService } = vi.hoisted(() => ({
  updateTag: vi.fn(),
  revalidatePath: vi.fn(),
  assertAdmin: vi.fn(),
  pulsarThemeEditorContext: vi.fn(),
  getAlsTenant: vi.fn(),
  publish: vi.fn(),
  createThemeDocumentService: vi.fn(),
}));

vi.mock("next/cache", () => ({ updateTag, revalidatePath }));
vi.mock("@/lib/dashboard/assertAdmin", () => ({ assertAdmin: () => assertAdmin() }));
vi.mock("@/lib/pulsar/pulsarThemeEditorContext", () => ({
  pulsarThemeEditorContext: () => pulsarThemeEditorContext(),
}));
vi.mock("@/lib/tenant/alsTenantAccessor", () => ({ getAlsTenant: () => getAlsTenant() }));
vi.mock("@/lib/theme-document/createThemeDocumentService", () => ({
  createThemeDocumentService: (...args: unknown[]) => createThemeDocumentService(...args),
}));

vi.mock("@/lib/theme-document/server/writeVariantPins", () => ({
  writeVariantPins: vi.fn(),
}));

import { publishThemeDraft } from "@/app/[locale]/dashboard/admin/cms/themeDocumentActions";
import { siteThemeActiveCacheTagForTenant } from "@/types/theming";

describe("themeDocumentActions", () => {
  beforeEach(() => {
    updateTag.mockReset();
    revalidatePath.mockReset();
    assertAdmin.mockReset();
    pulsarThemeEditorContext.mockReset();
    getAlsTenant.mockReset();
    publish.mockReset();
    createThemeDocumentService.mockReset();
    createThemeDocumentService.mockImplementation(() => ({ publish }));
    pulsarThemeEditorContext.mockResolvedValue(null);
    getAlsTenant.mockReturnValue({ slug: "golden" });
    assertAdmin.mockResolvedValue({ supabase: { kind: "admin" }, user: { id: "admin-1" } });
  });

  it("rejects a missing admin session", async () => {
    assertAdmin.mockRejectedValue(new Error("forbidden"));
    const result = await publishThemeDraft({ locale: "es", siteThemeId: "theme-1", expectedHash: "hash-1" });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("returns the service code and refreshes the tenant tag after success", async () => {
    publish.mockResolvedValueOnce({ ok: false, code: "draft_missing" });
    const missing = await publishThemeDraft({ locale: "es", siteThemeId: "theme-1", expectedHash: "hash-1" });
    expect(missing).toEqual({ ok: false, code: "draft_missing" });
    expect(updateTag).not.toHaveBeenCalled();

    publish.mockResolvedValueOnce({ ok: true, data: { id: "pub-1", version: 2 } });
    const saved = await publishThemeDraft({ locale: "es", siteThemeId: "theme-1", expectedHash: "hash-1" });
    expect(saved).toEqual({ ok: true, data: { id: "pub-1", version: 2 } });
    expect(updateTag).toHaveBeenCalledWith(siteThemeActiveCacheTagForTenant("golden"));
    expect(revalidatePath).toHaveBeenCalledWith("/es");
  });

  it("builds the staff service when the Pulsar editor is open", async () => {
    pulsarThemeEditorContext.mockResolvedValue({ supabase: { kind: "pulsar" }, user: { id: "staff-1" } });
    publish.mockResolvedValue({ ok: false, code: "draft_missing" });
    await publishThemeDraft({ locale: "es", siteThemeId: "theme-1", expectedHash: "hash-1" });
    expect(createThemeDocumentService).toHaveBeenCalledWith(expect.objectContaining({
      tenantSlug: "golden",
      actor: { id: "staff-1", role: "staff" },
    }));
    expect(assertAdmin).not.toHaveBeenCalled();
  });
});

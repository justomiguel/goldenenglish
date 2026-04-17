/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createSiteThemeAction,
  duplicateSiteThemeAction,
  renameSiteThemeAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeActions";

const { mockAssertAdmin, recordSystemAudit, revalidatePath, updateTag } =
  vi.hoisted(() => ({
    mockAssertAdmin: vi.fn(),
    recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
    revalidatePath: vi.fn(),
    updateTag: vi.fn(),
  }));

vi.mock("@/lib/dashboard/assertAdmin", () => ({
  assertAdmin: () => mockAssertAdmin(),
}));

vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
  updateTag,
}));

const VALID_ID = "00000000-0000-4000-8000-000000000001";
const SOURCE_ID = "00000000-0000-4000-8000-000000000002";

describe("site theme actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects create when admin guard throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("nope"));
    const result = await createSiteThemeAction({
      locale: "en",
      name: "Spring",
      slug: "spring",
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects create with invalid input", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u1" } });
    const result = await createSiteThemeAction({
      locale: "en",
      name: "x",
      slug: "spring",
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });

  it("creates a theme without activation and audits", async () => {
    const insertSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: "theme-1" }, error: null });
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
    const insert = vi.fn().mockReturnValue({ select: insertSelect });
    const from = vi.fn().mockReturnValue({ insert });

    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "user-1" },
    });

    const result = await createSiteThemeAction({
      locale: "en",
      name: "Spring",
      slug: "spring-2026",
      activate: false,
    });

    expect(result).toEqual({ ok: true, id: "theme-1" });
    expect(from).toHaveBeenCalledWith("site_themes");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "spring-2026",
        name: "Spring",
        is_active: false,
        properties: {},
        content: {},
        updated_by: "user-1",
      }),
    );
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "site_theme_created",
        resourceType: "site_theme",
        resourceId: "theme-1",
      }),
    );
    expect(updateTag).toHaveBeenCalledWith("site-theme-active");
    expect(revalidatePath).toHaveBeenCalled();
  });

  it("creates a theme and clears the previous active before activating", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq: updateEq });
    const insertSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: "theme-2" }, error: null });
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
    const insert = vi.fn().mockReturnValue({ select: insertSelect });
    const from = vi.fn().mockReturnValue({ update, insert });

    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "user-2" },
    });

    const result = await createSiteThemeAction({
      locale: "es",
      name: "Anniversary",
      slug: "anniversary",
      activate: true,
    });

    expect(result).toEqual({ ok: true, id: "theme-2" });
    expect(update).toHaveBeenCalledWith({ is_active: false });
    expect(updateEq).toHaveBeenCalledWith("is_active", true);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ is_active: true }),
    );
  });

  it("returns slug_taken when DB raises a unique violation", async () => {
    const insertSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "23505", message: "duplicate key" },
    });
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
    const insert = vi.fn().mockReturnValue({ select: insertSelect });
    const from = vi.fn().mockReturnValue({ insert });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });
    const result = await createSiteThemeAction({
      locale: "en",
      name: "Existing",
      slug: "existing",
    });
    expect(result).toEqual({ ok: false, code: "slug_taken" });
  });

  it("rename returns not_found when row is missing", async () => {
    const fetchMaybeSingle = vi.fn().mockResolvedValue({ data: null });
    const fetchEq = vi.fn().mockReturnValue({ maybeSingle: fetchMaybeSingle });
    const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq });
    const from = vi.fn().mockReturnValue({ select: fetchSelect });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });

    const result = await renameSiteThemeAction({
      locale: "en",
      id: VALID_ID,
      name: "New name",
    });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("duplicate copies properties and content from source", async () => {
    const sourceRow = {
      id: SOURCE_ID,
      slug: "summer",
      name: "Summer",
      is_active: false,
      archived_at: null,
      properties: { "color.primary": "#abcdef" },
      content: { inicio: { hero: { es: "Hola" } } },
    };
    const fetchMaybeSingle = vi.fn().mockResolvedValue({ data: sourceRow });
    const fetchEq = vi.fn().mockReturnValue({ maybeSingle: fetchMaybeSingle });
    const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq });

    const insertSingle = vi
      .fn()
      .mockResolvedValue({ data: { id: "theme-3" }, error: null });
    const insertSelect = vi.fn().mockReturnValue({ single: insertSingle });
    const insert = vi.fn().mockReturnValue({ select: insertSelect });
    const from = vi.fn().mockReturnValue({ select: fetchSelect, insert });

    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });

    const result = await duplicateSiteThemeAction({
      locale: "en",
      sourceId: SOURCE_ID,
      name: "Summer copy",
      slug: "summer-copy",
    });

    expect(result).toEqual({ ok: true, id: "theme-3" });
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        slug: "summer-copy",
        is_active: false,
        properties: sourceRow.properties,
        content: sourceRow.content,
      }),
    );
  });
});

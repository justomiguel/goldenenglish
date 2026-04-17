/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetSiteThemePropertiesAction,
  updateSiteThemePropertiesAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemePropertiesActions";

const {
  mockAssertAdmin,
  recordSystemAudit,
  revalidatePath,
  updateTag,
  loadProperties,
} = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  loadProperties: vi.fn(),
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

vi.mock("@/lib/theme/themeParser", () => ({
  loadProperties: () => loadProperties(),
}));

const VALID_ID = "00000000-0000-4000-8000-000000000001";

function makeSupabaseWithRow(row: Record<string, unknown> | null) {
  const fetchMaybeSingle = vi.fn().mockResolvedValue({ data: row });
  const fetchEq = vi.fn().mockReturnValue({ maybeSingle: fetchMaybeSingle });
  const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq });

  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: updateEq });
  const from = vi.fn().mockReturnValue({ select: fetchSelect, update });
  return { from, update, updateEq };
}

describe("updateSiteThemePropertiesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadProperties.mockReturnValue({
      "color.primary": "#103A5C",
      "color.secondary": "#A31A22",
      "layout.max.width": "1280px",
      "legal.age.majority": "18",
    });
  });

  it("rejects when admin guard throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("nope"));
    const result = await updateSiteThemePropertiesAction({
      locale: "en",
      id: VALID_ID,
      overrides: { "color.primary": "#000" },
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects invalid uuid", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u" } });
    const result = await updateSiteThemePropertiesAction({
      locale: "en",
      id: "not-a-uuid",
      overrides: {},
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });

  it("returns not_found when row is missing", async () => {
    const { from } = makeSupabaseWithRow(null);
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });
    const result = await updateSiteThemePropertiesAction({
      locale: "en",
      id: VALID_ID,
      overrides: { "color.primary": "#000" },
    });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("persists only allow-listed overrides that diverge from defaults", async () => {
    const { from, update, updateEq } = makeSupabaseWithRow({
      id: VALID_ID,
      slug: "default",
      name: "Default",
      is_active: true,
      archived_at: null,
      properties: {},
      content: {},
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "user-9" },
    });

    const result = await updateSiteThemePropertiesAction({
      locale: "es",
      id: VALID_ID,
      overrides: {
        "color.primary": "#000000",
        "color.secondary": "#A31A22",
        "layout.max.width": "  ",
        "legal.age.majority": "21",
      },
    });

    expect(result).toEqual({ ok: true, id: VALID_ID });
    expect(update).toHaveBeenCalledWith({
      properties: { "color.primary": "#000000" },
      updated_by: "user-9",
    });
    expect(updateEq).toHaveBeenCalledWith("id", VALID_ID);
    expect(updateTag).toHaveBeenCalledWith("site-theme-active");
    expect(revalidatePath).toHaveBeenCalled();
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "site_theme_properties_updated",
        resourceType: "site_theme",
        resourceId: VALID_ID,
      }),
    );
  });
});

describe("resetSiteThemePropertiesAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadProperties.mockReturnValue({});
  });

  it("wipes overrides on the row and audits", async () => {
    const { from, update, updateEq } = makeSupabaseWithRow({
      id: VALID_ID,
      slug: "x",
      name: "X",
      is_active: false,
      archived_at: null,
      properties: { "color.primary": "#000" },
      content: {},
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "user-7" },
    });

    const result = await resetSiteThemePropertiesAction({
      locale: "en",
      id: VALID_ID,
    });

    expect(result).toEqual({ ok: true, id: VALID_ID });
    expect(update).toHaveBeenCalledWith({
      properties: {},
      updated_by: "user-7",
    });
    expect(updateEq).toHaveBeenCalledWith("id", VALID_ID);
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "site_theme_properties_reset",
        resourceType: "site_theme",
        resourceId: VALID_ID,
      }),
    );
  });
});

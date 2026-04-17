/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resetSiteThemeContentAction,
  updateSiteThemeContentAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeContentActions";

const {
  mockAssertAdmin,
  recordSystemAudit,
  revalidatePath,
  updateTag,
  getDictionary,
} = vi.hoisted(() => ({
  mockAssertAdmin: vi.fn(),
  recordSystemAudit: vi.fn().mockResolvedValue({ ok: true }),
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
  getDictionary: vi.fn(),
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

vi.mock("@/lib/i18n/dictionaries", () => ({
  getDictionary: (locale: string) => getDictionary(locale),
}));

const VALID_ID = "00000000-0000-4000-8000-000000000111";

function makeSupabaseWithRow(row: Record<string, unknown> | null) {
  const fetchMaybeSingle = vi.fn().mockResolvedValue({ data: row });
  const fetchEq = vi.fn().mockReturnValue({ maybeSingle: fetchMaybeSingle });
  const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq });

  const updateEq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn().mockReturnValue({ eq: updateEq });
  const from = vi.fn().mockReturnValue({ select: fetchSelect, update });
  return { from, update, updateEq };
}

const dictWithLanding = (storyTitle: string) =>
  ({
    landing: { story: { title: storyTitle, body1: "", body2: "" } },
  }) as unknown as Awaited<ReturnType<typeof getDictionary>>;

beforeEach(() => {
  vi.clearAllMocks();
  getDictionary.mockImplementation((locale: string) =>
    Promise.resolve(
      dictWithLanding(locale === "es" ? "Nuestra historia" : "Our story"),
    ),
  );
});

describe("updateSiteThemeContentAction", () => {
  it("rejects when admin guard throws", async () => {
    mockAssertAdmin.mockRejectedValue(new Error("nope"));
    const result = await updateSiteThemeContentAction({
      locale: "en",
      id: VALID_ID,
      section: "historia",
      copy: { "story.title": { en: "x" } },
    });
    expect(result).toEqual({ ok: false, code: "forbidden" });
  });

  it("rejects invalid sections", async () => {
    mockAssertAdmin.mockResolvedValue({ supabase: {}, user: { id: "u" } });
    const result = await updateSiteThemeContentAction({
      locale: "en",
      id: VALID_ID,
      section: "bogus",
      copy: {},
    });
    expect(result).toEqual({ ok: false, code: "invalid_input" });
  });

  it("returns not_found when row is missing", async () => {
    const { from } = makeSupabaseWithRow(null);
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });
    const result = await updateSiteThemeContentAction({
      locale: "en",
      id: VALID_ID,
      section: "historia",
      copy: { "story.title": { en: "x" } },
    });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("merges cleaned section content into existing JSONB and audits", async () => {
    const previousContent = {
      historia: { "story.title": { en: "Old" } },
      modalidades: { "modalities.title": { es: "Otro" } },
    };
    const { from, update, updateEq } = makeSupabaseWithRow({
      id: VALID_ID,
      slug: "default",
      name: "Default",
      is_active: true,
      archived_at: null,
      properties: {},
      content: previousContent,
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "user-1" },
    });

    const result = await updateSiteThemeContentAction({
      locale: "es",
      id: VALID_ID,
      section: "historia",
      copy: {
        "story.title": { en: "Brand new title", es: "Nuestra historia" },
        "story.body1": { en: "  " },
        "story.unknown": { en: "drop me" },
      },
    });

    expect(result).toEqual({ ok: true, id: VALID_ID });
    expect(update).toHaveBeenCalledWith({
      content: {
        historia: { "story.title": { en: "Brand new title" } },
        modalidades: { "modalities.title": { es: "Otro" } },
      },
      updated_by: "user-1",
    });
    expect(updateEq).toHaveBeenCalledWith("id", VALID_ID);
    expect(updateTag).toHaveBeenCalledWith("site-theme-active");
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "site_theme_content_updated",
        resourceType: "site_theme",
        resourceId: VALID_ID,
        payload: expect.objectContaining({ section: "historia" }),
      }),
    );
  });

  it("removes a section when the cleaned payload is empty", async () => {
    const { from, update } = makeSupabaseWithRow({
      id: VALID_ID,
      slug: "default",
      name: "Default",
      is_active: true,
      archived_at: null,
      properties: {},
      content: {
        historia: { "story.title": { en: "Old" } },
        modalidades: { "modalities.title": { es: "Otro" } },
      },
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });

    const result = await updateSiteThemeContentAction({
      locale: "es",
      id: VALID_ID,
      section: "historia",
      copy: {
        "story.title": { en: "Our story" },
      },
    });

    expect(result).toEqual({ ok: true, id: VALID_ID });
    expect(update).toHaveBeenCalledWith({
      content: { modalidades: { "modalities.title": { es: "Otro" } } },
      updated_by: "u",
    });
  });
});

describe("resetSiteThemeContentAction", () => {
  it("wipes a single section when section is provided", async () => {
    const { from, update } = makeSupabaseWithRow({
      id: VALID_ID,
      slug: "x",
      name: "X",
      is_active: false,
      archived_at: null,
      properties: {},
      content: {
        historia: { "story.title": { en: "Old" } },
        modalidades: { "modalities.title": { es: "Otro" } },
      },
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "user-r" },
    });
    const result = await resetSiteThemeContentAction({
      locale: "en",
      id: VALID_ID,
      section: "historia",
    });
    expect(result).toEqual({ ok: true, id: VALID_ID });
    expect(update).toHaveBeenCalledWith({
      content: { modalidades: { "modalities.title": { es: "Otro" } } },
      updated_by: "user-r",
    });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "site_theme_content_reset",
        payload: { section: "historia" },
      }),
    );
  });

  it("wipes everything when section is omitted", async () => {
    const { from, update } = makeSupabaseWithRow({
      id: VALID_ID,
      slug: "x",
      name: "X",
      is_active: false,
      archived_at: null,
      properties: {},
      content: {
        historia: { "story.title": { en: "Old" } },
      },
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "user-r" },
    });
    const result = await resetSiteThemeContentAction({
      locale: "en",
      id: VALID_ID,
    });
    expect(result).toEqual({ ok: true, id: VALID_ID });
    expect(update).toHaveBeenCalledWith({
      content: {},
      updated_by: "user-r",
    });
  });
});

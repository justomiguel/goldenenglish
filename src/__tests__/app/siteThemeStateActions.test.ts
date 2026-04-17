/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  activateSiteThemeAction,
  archiveSiteThemeAction,
  restoreSiteThemeAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeStateActions";

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

interface MakeSupabaseInput {
  fetched: {
    id: string;
    slug: string;
    name: string;
    is_active: boolean;
    archived_at: string | null;
    properties: unknown;
    content: unknown;
  } | null;
  updateError?: { code?: string; message?: string } | null;
  clearError?: { message?: string } | null;
}

function makeSupabase({
  fetched,
  updateError = null,
  clearError = null,
}: MakeSupabaseInput) {
  const updateEqs: Array<[string, unknown]> = [];
  const updates: unknown[] = [];

  const fetchMaybeSingle = vi.fn().mockResolvedValue({ data: fetched });
  const fetchEq = vi.fn().mockReturnValue({ maybeSingle: fetchMaybeSingle });
  const fetchSelect = vi.fn().mockReturnValue({ eq: fetchEq });

  const update = vi.fn((payload: unknown) => {
    updates.push(payload);
    const eq = vi.fn((col: string, val: unknown) => {
      updateEqs.push([col, val]);
      if (col === "is_active" && val === true) {
        return Promise.resolve({ error: clearError });
      }
      return Promise.resolve({ error: updateError });
    });
    return { eq };
  });

  const from = vi.fn().mockReturnValue({ select: fetchSelect, update });
  return { from, updates, updateEqs };
}

describe("site theme state actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("activate fails when not found", async () => {
    const { from } = makeSupabase({ fetched: null });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });
    const result = await activateSiteThemeAction({
      locale: "en",
      id: VALID_ID,
    });
    expect(result).toEqual({ ok: false, code: "not_found" });
  });

  it("activate fails when archived", async () => {
    const { from } = makeSupabase({
      fetched: {
        id: VALID_ID,
        slug: "winter",
        name: "Winter",
        is_active: false,
        archived_at: "2026-01-01T00:00:00Z",
        properties: {},
        content: {},
      },
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });
    const result = await activateSiteThemeAction({
      locale: "en",
      id: VALID_ID,
    });
    expect(result).toEqual({ ok: false, code: "archived_cannot_activate" });
  });

  it("activate clears previously active row then sets the new one", async () => {
    const { from, updates, updateEqs } = makeSupabase({
      fetched: {
        id: VALID_ID,
        slug: "winter",
        name: "Winter",
        is_active: false,
        archived_at: null,
        properties: {},
        content: {},
      },
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "user-x" },
    });

    const result = await activateSiteThemeAction({
      locale: "es",
      id: VALID_ID,
    });

    expect(result).toEqual({ ok: true, id: VALID_ID });
    expect(updates).toContainEqual({ is_active: false });
    expect(updates).toContainEqual({ is_active: true, updated_by: "user-x" });
    expect(updateEqs).toContainEqual(["is_active", true]);
    expect(updateEqs).toContainEqual(["id", VALID_ID]);
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "site_theme_activated" }),
    );
    expect(updateTag).toHaveBeenCalledWith("site-theme-active");
  });

  it("archive refuses to archive the active theme", async () => {
    const { from } = makeSupabase({
      fetched: {
        id: VALID_ID,
        slug: "winter",
        name: "Winter",
        is_active: true,
        archived_at: null,
        properties: {},
        content: {},
      },
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });
    const result = await archiveSiteThemeAction({
      locale: "en",
      id: VALID_ID,
    });
    expect(result).toEqual({ ok: false, code: "active_cannot_archive" });
  });

  it("archive sets archived_at and audits", async () => {
    const { from, updates } = makeSupabase({
      fetched: {
        id: VALID_ID,
        slug: "winter",
        name: "Winter",
        is_active: false,
        archived_at: null,
        properties: {},
        content: {},
      },
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });
    const result = await archiveSiteThemeAction({
      locale: "en",
      id: VALID_ID,
    });
    expect(result).toEqual({ ok: true, id: VALID_ID });
    const archivePayload = updates[0] as { archived_at: string };
    expect(typeof archivePayload.archived_at).toBe("string");
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "site_theme_archived" }),
    );
  });

  it("restore is a no-op when row is not archived", async () => {
    const { from, updates } = makeSupabase({
      fetched: {
        id: VALID_ID,
        slug: "winter",
        name: "Winter",
        is_active: false,
        archived_at: null,
        properties: {},
        content: {},
      },
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });
    const result = await restoreSiteThemeAction({
      locale: "en",
      id: VALID_ID,
    });
    expect(result).toEqual({ ok: true, id: VALID_ID });
    expect(updates.length).toBe(0);
    expect(recordSystemAudit).not.toHaveBeenCalled();
  });

  it("restore clears archived_at when archived", async () => {
    const { from, updates } = makeSupabase({
      fetched: {
        id: VALID_ID,
        slug: "winter",
        name: "Winter",
        is_active: false,
        archived_at: "2026-01-01T00:00:00Z",
        properties: {},
        content: {},
      },
    });
    mockAssertAdmin.mockResolvedValue({
      supabase: { from },
      user: { id: "u" },
    });
    const result = await restoreSiteThemeAction({
      locale: "en",
      id: VALID_ID,
    });
    expect(result).toEqual({ ok: true, id: VALID_ID });
    expect(updates).toContainEqual({ archived_at: null, updated_by: "u" });
    expect(recordSystemAudit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "site_theme_restored" }),
    );
  });
});

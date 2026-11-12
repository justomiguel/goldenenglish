import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { parseDesignTokens } from "@/lib/design-tokens/parseDesignTokens";
import { createThemeDocumentService } from "@/lib/theme-document/createThemeDocumentService";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";

const logServerWarn = vi.fn();
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: (...args: unknown[]) => logServerWarn(...args),
}));

const recordSystemAudit = vi.fn().mockResolvedValue({ ok: true });
vi.mock("@/lib/analytics/server/recordSystemAudit", () => ({
  recordSystemAudit: (...args: unknown[]) => recordSystemAudit(...args),
}));

type Row = { id: string; site_theme_id: string; status: string; document: unknown; document_hash: string; version: number };

function document(color = "#112233"): ThemeDocumentV1 {
  const tokens = parseDesignTokens({ ...SYSTEM_PROPERTIES_DEFAULTS });
  if (color !== "defaults") {
    for (const key of Object.keys(tokens.color) as (keyof typeof tokens.color)[]) tokens.color[key] = color;
  }
  return {
    contractVersion: 1,
    tokens,
    fontIds: { heading: tokens.font.heading, body: tokens.font.body },
    sections: [],
    pages: {},
    editableBy: {},
  };
}

function fakeClient(rows: Row[], rpc: { data?: unknown; error?: { message: string } | null } = {}) {
  return {
    from() {
      const filters: [string, unknown][] = [];
      const api = {
        select() { return api; },
        eq(column: string, value: unknown) {
          filters.push([column, value]);
          return api;
        },
        async maybeSingle() {
          const match = rows.find((row) => filters.every(([column, value]) => (row as Record<string, unknown>)[column] === value));
          return { data: match ?? null, error: null };
        },
        update(patch: Record<string, unknown>) {
          return {
            eq: async (column: string, value: unknown) => {
              const row = rows.find((item) => (item as Record<string, unknown>)[column] === value);
              if (row) Object.assign(row, patch);
              return { error: null };
            },
          };
        },
        insert(row: Row) {
          rows.push({ ...row, id: "draft-new" });
          return Promise.resolve({ error: null });
        },
        delete() {
          return {
            eq(column: string, value: unknown) {
              filters.push([column, value]);
              return api;
            },
          };
        },
        then(resolve: (value: { error: null }) => void) {
          for (let index = rows.length - 1; index >= 0; index -= 1) {
            const row = rows[index];
            if (row && filters.every(([column, value]) => (row as Record<string, unknown>)[column] === value)) rows.splice(index, 1);
          }
          resolve({ error: null });
        },
      };
      return api;
    },
    rpc: async () => (rpc.error ? { data: null, error: rpc.error } : { data: rpc.data ?? [{ id: "pub-1", version: 4 }], error: null }),
  } as unknown as SupabaseClient;
}

describe("createThemeDocumentService", () => {
  const pins = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    logServerWarn.mockReset();
    recordSystemAudit.mockClear();
    pins.mockReset();
    pins.mockResolvedValue(undefined);
  });

  function service(client: SupabaseClient, role: "staff" | "admin" = "admin") {
    return createThemeDocumentService({ client, tenantSlug: "golden", actor: { id: "actor-1", role }, pins });
  }

  it("rejects an invalid schema, a stale hash, a locked edit, and an oversize document", async () => {
    const current = document();
    const rows: Row[] = [{ id: "draft-1", site_theme_id: "theme-1", status: "draft", document: current, document_hash: "hash-1", version: 0 }];
    const api = service(fakeClient(rows));

    const invalid = await api.saveDraft({ siteThemeId: "theme-1", document: { contractVersion: 2 }, baseHash: "hash-1" });
    expect(invalid).toMatchObject({ ok: false, code: "variant_props_invalid", path: "contractVersion" });

    const stale = await api.saveDraft({ siteThemeId: "theme-1", document: current, baseHash: "other" });
    expect(stale).toMatchObject({ ok: false, code: "document_stale" });

    const next = document();
    next.tokens.color.primary = "#ABCDEF";
    const locked = await api.saveDraft({ siteThemeId: "theme-1", document: next, baseHash: "hash-1" });
    expect(locked).toMatchObject({ ok: false, code: "field_locked", path: "tokens.color.primary" });

    const huge = document();
    huge.sections = [{ id: "hero", variantId: "hero.bleed", major: 1, props: { body: "x".repeat(300_000) } }];
    const fresh = service(fakeClient([]));
    const oversize = await fresh.saveDraft({ siteThemeId: "theme-1", document: huge, baseHash: null });
    expect(oversize).toMatchObject({ ok: false, code: "document_too_large" });
    expect(logServerWarn).toHaveBeenCalledWith("themeDocument.save", expect.objectContaining({ code: "document_too_large" }));
  });

  it("returns the first publish issue and maps RPC errors", async () => {
    const draft = document();
    const rows: Row[] = [{ id: "draft-1", site_theme_id: "theme-1", status: "draft", document: draft, document_hash: "hash-1", version: 0 }];
    const issue = await service(fakeClient(rows)).publish({ siteThemeId: "theme-1", expectedHash: "hash-1" });
    expect(issue).toMatchObject({ ok: false, code: "contrast_below_aa" });

    const valid = document("defaults");
    const staleRows: Row[] = [{ id: "draft-1", site_theme_id: "theme-1", status: "draft", document: valid, document_hash: "hash-1", version: 0 }];
    const stale = await service(fakeClient(staleRows, { error: { message: "document_stale" } })).publish({
      siteThemeId: "theme-1",
      expectedHash: "hash-1",
    });
    expect(stale).toMatchObject({ ok: false, code: "document_stale" });
    expect(logServerWarn).toHaveBeenCalledWith("themeDocument.publish", expect.objectContaining({ code: "document_stale" }));
  });

  it("publishes, keeps ok when pins fail, and audits the version", async () => {
    const valid = document("defaults");
    const rows: Row[] = [{ id: "draft-1", site_theme_id: "theme-1", status: "draft", document: valid, document_hash: "hash-1", version: 0 }];
    pins.mockRejectedValueOnce(new Error("pins down"));
    const result = await service(fakeClient(rows)).publish({ siteThemeId: "theme-1", expectedHash: "hash-1" });
    expect(result).toEqual({ ok: true, data: { id: "pub-1", version: 4 } });
    expect(logServerWarn).toHaveBeenCalledWith("themeDocument.pins", { code: "pins_write_failed" });
    expect(recordSystemAudit).toHaveBeenCalledWith(expect.objectContaining({
      action: "theme_document.publish",
      resourceType: "theme_document",
      resourceId: "pub-1",
      payload: expect.objectContaining({ version: 4, documentHash: "hash-1", changedPaths: 0 }),
    }));
  });
});

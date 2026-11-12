import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseDesignTokens } from "@/lib/design-tokens/parseDesignTokens";
import { SYSTEM_PROPERTIES_DEFAULTS } from "@/lib/theme/systemPropertiesDefaults";
import { siteThemeActiveCacheTagForTenant } from "@/types/theming";
import type { ThemeDocumentV1 } from "@/lib/theme-document/themeDocumentV1";

const cacheCalls: { key: string[]; tags: string[] }[] = [];
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => unknown, key: string[], opts: { tags: string[] }) => {
    cacheCalls.push({ key, tags: opts.tags });
    return () => fn();
  },
}));

const logServerWarn = vi.fn();
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: (...args: unknown[]) => logServerWarn(...args),
  logServerException: vi.fn(),
}));

const tenants = new Map<string, { url: string }>();
vi.mock("@/lib/tenant/tenantRegistry", () => ({
  getTenantBySlug: (slug: string) => {
    const tenant = tenants.get(slug);
    return tenant ? { slug, supabaseUrl: tenant.url, supabaseAnonKey: "anon", dataMode: "project" } : null;
  },
}));

const clients = new Map<string, unknown>();
vi.mock("@/lib/supabase/anon", () => ({
  createAnonClientFromCredentials: (url: string) => clients.get(url),
}));
vi.mock("@/lib/supabase/bindInstituteDataPlane", () => ({
  bindInstituteDataPlane: (client: unknown) => client,
}));

import { loadPublishedThemeDocument } from "@/lib/theme-document/loadPublishedThemeDocument";

function document(heading: string): ThemeDocumentV1 {
  const tokens = parseDesignTokens({ ...SYSTEM_PROPERTIES_DEFAULTS });
  tokens.font.heading = heading;
  return {
    contractVersion: 1,
    tokens,
    fontIds: { heading, body: tokens.font.body },
    sections: [],
    pages: {},
    editableBy: {},
  };
}

function client(data: unknown, error: { message: string } | null = null) {
  const api = {
    select() { return api; },
    eq() { return api; },
    maybeSingle: async () => ({
      data: { id: "theme-1", properties: {}, skin_content: null, template_kind: "deportes" },
      error: null,
    }),
  };
  return { from: () => api, rpc: async () => ({ data, error }) };
}

describe("loadPublishedThemeDocument", () => {
  beforeEach(() => {
    cacheCalls.length = 0;
    tenants.clear();
    clients.clear();
    logServerWarn.mockReset();
  });

  it("returns the published document and falls back when the RPC fails", async () => {
    tenants.set("a", { url: "https://a.example" });
    clients.set("https://a.example", client(document("fraunces")));
    const published = await loadPublishedThemeDocument("a");
    expect(published.source).toBe("published");
    expect(published.document.fontIds.heading).toBe("fraunces");
    expect(cacheCalls.at(-1)?.key).toEqual(["theme-document-published", "a"]);
    expect(cacheCalls.at(-1)?.tags).toContain(siteThemeActiveCacheTagForTenant("a"));

    clients.set("https://a.example", client(null, { message: "boom" }));
    const legacy = await loadPublishedThemeDocument("a");
    expect(legacy.source).toBe("legacy");
    expect(legacy.document.sections[0]?.variantId.startsWith("hero.")).toBe(true);
    expect(logServerWarn).toHaveBeenCalledWith("themeDocument.read", { code: "rpc_failed" });
  });

  it("keeps two tenants on separate documents and cache keys", async () => {
    tenants.set("a", { url: "https://a.example" });
    tenants.set("b", { url: "https://b.example" });
    clients.set("https://a.example", client(document("fraunces")));
    clients.set("https://b.example", client(document("literata")));
    const first = await loadPublishedThemeDocument("a");
    const second = await loadPublishedThemeDocument("b");
    expect(first.document.fontIds.heading).toBe("fraunces");
    expect(second.document.fontIds.heading).toBe("literata");
    expect(cacheCalls.map((call) => call.key[1])).toEqual(["a", "b"]);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { locales } from "@/lib/i18n/dictionaries";

const mockGetPublicSiteUrl = vi.fn<() => URL | null>();
const { mockCreateClient, mockLoadActiveTheme } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockLoadActiveTheme: vi.fn(),
}));

vi.mock("@/lib/theme/loadActiveTheme", () => ({
  loadActiveTheme: () => mockLoadActiveTheme(),
}));

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => mockGetPublicSiteUrl(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}));

import sitemap from "@/app/sitemap";

describe("app/sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadActiveTheme.mockResolvedValue(null);
  });

  it("adds the family guide only on the Mozarthitos template", async () => {
    mockGetPublicSiteUrl.mockReturnValue(new URL("https://mozarthitos.test"));
    const empty = vi.fn().mockResolvedValue({ data: [] });
    const chain: Record<string, unknown> = {};
    for (const key of ["select", "eq", "not", "lte", "is"]) chain[key] = vi.fn(() => chain);
    chain.limit = empty;
    mockCreateClient.mockReturnValue({ from: () => chain });

    mockLoadActiveTheme.mockResolvedValue({ theme: { templateKind: "mozarthitos" } });
    const mz = await sitemap();
    expect(mz.filter((e) => e.url.endsWith("/encuentra-tu-clase"))).toHaveLength(locales.length);

    mockLoadActiveTheme.mockResolvedValue({ theme: { templateKind: "classic" } });
    const classic = await sitemap();
    expect(classic.some((e) => e.url.includes("encuentra-tu-clase"))).toBe(false);
  });

  it("returns empty list when base URL is unknown", async () => {
    mockGetPublicSiteUrl.mockReturnValue(null);
    await expect(sitemap()).resolves.toEqual([]);
  });

  it("emits marketing + login + contact URLs per locale", async () => {
    mockGetPublicSiteUrl.mockReturnValue(new URL("https://golden.test"));
    const blogLimit = vi.fn().mockResolvedValue({ data: [] });
    const blogLte = vi.fn().mockReturnValue({ limit: blogLimit });
    const blogNot = vi.fn().mockReturnValue({ lte: blogLte });
    const blogEqVisibility = vi.fn().mockReturnValue({ not: blogNot });
    const blogEq = vi.fn().mockReturnValue({ eq: blogEqVisibility });
    const blogSelect = vi.fn().mockReturnValue({ eq: blogEq });

    const eventsLimit = vi.fn().mockResolvedValue({ data: [] });
    const eventsIs = vi.fn().mockReturnValue({ limit: eventsLimit });
    const eventsEq = vi.fn().mockReturnValue({ is: eventsIs });
    const eventsSelect = vi.fn().mockReturnValue({ eq: eventsEq });

    const from = vi.fn((table: string) => {
      if (table === "blog_article_translations") return { select: blogSelect };
      if (table === "events") return { select: eventsSelect };
      return { select: vi.fn() };
    });
    mockCreateClient.mockReturnValue({ from });

    const entries = await sitemap();
    expect(entries).toHaveLength(locales.length * 7);
    expect(entries[0]?.url).toContain("/");
    expect(entries.some((e) => e.url.includes("/login"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/contact"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/privacidad"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/preguntas"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/blog"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/events"))).toBe(true);
  });

  it("omits the answer page on the platform host", async () => {
    mockGetPublicSiteUrl.mockReturnValue(new URL("https://centrolisto.cl"));
    const limit = vi.fn().mockResolvedValue({ data: [] });
    const lte = vi.fn().mockReturnValue({ limit });
    const not = vi.fn().mockReturnValue({ lte });
    const eq = vi.fn().mockReturnValue({ not });
    const select = vi.fn().mockReturnValue({ eq });
    const eventsLimit = vi.fn().mockResolvedValue({ data: [] });
    const eventsIs = vi.fn().mockReturnValue({ limit: eventsLimit });
    const eventsEq = vi.fn().mockReturnValue({ is: eventsIs });
    const eventsSelect = vi.fn().mockReturnValue({ eq: eventsEq });
    mockCreateClient.mockReturnValue({
      from: (table: string) => {
        if (table === "events") return { select: eventsSelect };
        return { select };
      },
    });

    const entries = await sitemap();
    expect(entries).toHaveLength(locales.length * 13);
    expect(entries.some((e) => e.url.includes("/para/danza"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/soluciones/presencia"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/precios"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/producto"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/clientes"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/contacto"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/login"))).toBe(false);
    expect(entries.some((e) => e.url.includes("/admin/plantillas"))).toBe(false);
    expect(entries.some((e) => e.url.includes("/preguntas"))).toBe(false);
    expect(entries.some((e) => e.url.includes("/blog"))).toBe(false);
    expect(entries.some((e) => e.url.includes("/events"))).toBe(false);
    expect(mockCreateClient).not.toHaveBeenCalled();
  });

  it("lists the public pages on localhost when the dev target is pulsar", async () => {
    const previous = process.env.DEV_TENANT_SLUG;
    process.env.DEV_TENANT_SLUG = "pulsar";
    try {
      mockGetPublicSiteUrl.mockReturnValue(new URL("http://localhost:3000/"));
      const entries = await sitemap();
      expect(entries).toHaveLength(locales.length * 13);
    expect(entries.some((e) => e.url.includes("/para/danza"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/soluciones/presencia"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/precios"))).toBe(true);
      expect(entries.some((e) => e.url.includes("localhost:3000/es/producto"))).toBe(true);
      expect(mockCreateClient).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.DEV_TENANT_SLUG;
      else process.env.DEV_TENANT_SLUG = previous;
    }
  });
});

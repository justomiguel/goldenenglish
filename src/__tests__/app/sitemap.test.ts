import { describe, it, expect, vi, beforeEach } from "vitest";
import { locales } from "@/lib/i18n/dictionaries";

const mockGetPublicSiteUrl = vi.fn<() => URL | null>();
const { mockCreateClient } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
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
    expect(entries).toHaveLength(locales.length * 4);
    expect(entries.some((e) => e.url.includes("/producto"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/clientes"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/contacto"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/login"))).toBe(false);
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
      expect(entries).toHaveLength(locales.length * 4);
      expect(entries.some((e) => e.url.includes("localhost:3000/es/producto"))).toBe(true);
      expect(mockCreateClient).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) delete process.env.DEV_TENANT_SLUG;
      else process.env.DEV_TENANT_SLUG = previous;
    }
  });
});

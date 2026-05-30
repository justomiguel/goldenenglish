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
    const blogEq = vi.fn().mockReturnValue({ not: blogNot });
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
    expect(entries).toHaveLength(locales.length * 5);
    expect(entries[0]?.url).toContain("/");
    expect(entries.some((e) => e.url.includes("/login"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/contact"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/blog"))).toBe(true);
    expect(entries.some((e) => e.url.includes("/events"))).toBe(true);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { locales } from "@/lib/i18n/dictionaries";

const mockGetPublicSiteUrl = vi.fn<() => URL | null>();

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => mockGetPublicSiteUrl(),
}));

import sitemap from "@/app/sitemap";

describe("app/sitemap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty list when base URL is unknown", () => {
    mockGetPublicSiteUrl.mockReturnValue(null);
    expect(sitemap()).toEqual([]);
  });

  it("emits marketing + login URLs per locale", () => {
    mockGetPublicSiteUrl.mockReturnValue(new URL("https://golden.test"));
    const entries = sitemap();
    expect(entries).toHaveLength(locales.length * 2);
    expect(entries[0]?.url).toContain("/");
    expect(entries.some((e) => e.url.includes("/login"))).toBe(true);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";

const { mockLoadActiveTheme, mockNotFound } = vi.hoisted(() => ({
  mockLoadActiveTheme: vi.fn(),
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: mockNotFound }));
vi.mock("@/lib/theme/loadActiveTheme", () => ({ loadActiveTheme: () => mockLoadActiveTheme() }));
vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: async () => ({ name: "Mozarthitos" }),
}));
vi.mock("@/lib/brand/resolvePublicBrand", () => ({
  resolvePublicBrandWithSetup: async () => ({
    brand: { name: "Mozarthitos" },
    dict: dictEs,
    needsInitialSiteSetup: false,
  }),
}));
vi.mock("@/lib/blog/loadBlogEnabled", () => ({ loadBlogEnabled: async () => false }));
vi.mock("@/lib/shop/loadMerchEnabled", () => ({ loadMerchEnabled: async () => false }));
vi.mock("@/lib/auth/loadRequestSessionEmail", () => ({
  loadRequestSessionEmail: async () => null,
}));
vi.mock("@/lib/site/buildResolvedPublicShareMetadata", () => ({
  buildResolvedPublicShareMetadata: async (input: { what: string; academyName: string }) => ({
    title: { absolute: `${input.what} | ${input.academyName}` },
  }),
}));
vi.mock("@/components/organisms/PublicExperienceShell", () => ({
  PublicExperienceShell: ({ children }: { children: unknown }) => children,
}));
vi.mock("@/components/organisms/PublicBlogScreenMozarthitos", () => ({
  PublicBlogScreenMozarthitos: ({ children }: { children: unknown }) => children,
}));
vi.mock("@/components/organisms/MozarthitosFamilyGuideEntry", () => ({
  MozarthitosFamilyGuideEntry: () => null,
}));

import Page, { generateMetadata } from "@/app/[locale]/encuentra-tu-clase/page";

const props = {
  params: Promise.resolve({ locale: "es" }),
  searchParams: Promise.resolve({}),
};

describe("app/[locale]/encuentra-tu-clase", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when the tenant template is not Mozarthitos", async () => {
    mockLoadActiveTheme.mockResolvedValue({ theme: { templateKind: "classic", content: {} } });
    await expect(Page(props)).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(generateMetadata(props)).resolves.toEqual({});
  });

  it("renders on Mozarthitos and emits canonical plus hreflang", async () => {
    mockLoadActiveTheme.mockResolvedValue({ theme: { templateKind: "mozarthitos", content: {} } });
    await expect(Page(props)).resolves.toBeTruthy();
    const meta = await generateMetadata(props);
    expect(meta.title).toEqual({
      absolute: `${dictEs.landing.mz.guide.metaTitle} | Mozarthitos`,
    });
    expect(meta.alternates?.canonical).toBe("/es/encuentra-tu-clase");
    expect(meta.alternates?.languages).toMatchObject({
      en: "/en/encuentra-tu-clase",
      pt: "/pt/encuentra-tu-clase",
      "x-default": "/es/encuentra-tu-clase",
    });
  });
});

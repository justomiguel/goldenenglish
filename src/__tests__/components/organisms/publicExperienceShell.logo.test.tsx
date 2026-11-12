import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

const brand = {
  logoPath: "/x.png",
  logoAlt: "Mark",
  name: "Golden",
};

vi.mock("@/hooks/useAppSurface", () => ({
  useInstalledDisplay: () => true,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  usePathname: () => "/es",
}));

vi.mock("@/lib/brand/resolvePublicBrand", () => ({
  resolvePublicBrand: vi.fn(async () => brand),
}));

vi.mock("@/lib/settings/inscriptionsServer", () => ({
  getInscriptionsEnabled: async () => false,
}));

vi.mock("@/lib/shop/loadMerchEnabled", () => ({
  loadMerchEnabled: async () => false,
}));

vi.mock("@/lib/blog/loadBlogEnabled", () => ({
  loadBlogEnabled: async () => false,
}));

vi.mock("@/lib/auth/loadRequestSessionEmail", () => ({
  loadRequestSessionEmail: async () => null,
}));

import { PublicExperienceShell } from "@/components/organisms/PublicExperienceShell";

const dict = es as Dictionary;

async function renderShell(templateKind: string) {
  const ui = await PublicExperienceShell({
    locale: "es",
    dict,
    templateKind,
    sessionEmail: null,
    children: <p>Body</p>,
  });
  return render(ui);
}

describe("PublicExperienceShell logo", () => {
  beforeEach(() => {
    brand.logoPath = "/x.png";
    brand.name = "Golden";
  });

  it("uses the brand logo for a Nagô host", async () => {
    const view = await renderShell("nago");
    expect(view.container.querySelector("img")).toHaveAttribute("src", "/x.png");
  });

  it("keeps a Golden host free of the Nagô asset", async () => {
    const view = await renderShell("classic");
    expect(view.container.innerHTML.toLowerCase()).not.toContain("nago");
    expect(view.container.querySelector("img")).toHaveAttribute("src", "/x.png");
  });
});

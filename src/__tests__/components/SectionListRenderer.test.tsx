import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SectionListRenderer } from "@/components/organisms/SectionListRenderer";
import type { ThemeSection } from "@/lib/design-variants/sectionVariant";

const warn = vi.hoisted(() => vi.fn());

vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerWarn: warn,
}));

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => "web-desktop",
}));

const hero = (id: string, title: string): ThemeSection => ({
  id,
  variantId: "hero.split",
  major: 1,
  props: {
    scene: "Sunday",
    title,
    body: "A quiet class.",
    imageAlt: "Room",
    name: "North",
    heroSrc: "/generic/room.jpg",
  },
});

describe("SectionListRenderer", () => {
  beforeEach(() => {
    warn.mockReset();
    warn.mockResolvedValue(undefined);
  });

  it("renders a valid list in order", async () => {
    render(await SectionListRenderer({ sections: [hero("a", "First room"), hero("b", "Second room")], tenantSlug: "golden", locale: "en" }));
    const titles = screen.getAllByRole("heading").map((node) => node.textContent);
    expect(titles).toEqual(["First room", "Second room"]);
  });

  it("skips a missing major and still renders the other sections", async () => {
    const bad: ThemeSection = { ...hero("bad", "Missing"), major: 9 };
    render(
      await SectionListRenderer({
        sections: [hero("a", "First room"), bad, hero("b", "Second room")],
        tenantSlug: "golden",
        locale: "en",
      }),
    );
    expect(screen.getByRole("heading", { name: "First room" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Second room" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Missing" })).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      "designVariants.render",
      expect.objectContaining({
        code: "variant_version_missing",
        sectionId: "bad",
        variantId: "hero.split",
        major: 9,
      }),
    );
  });

  it("renders a pwa variant through the surface entry", async () => {
    const nav: ThemeSection = {
      id: "top",
      variantId: "nav.generic",
      major: 1,
      props: { kind: "jardin", siteName: "North School", logoAlt: "North", cta: "Enroll", items: [] },
    };
    render(await SectionListRenderer({ sections: [nav], tenantSlug: "golden", locale: "en" }));
    expect(document.querySelector('[data-variant-entry="nav.generic@1"]')).not.toBeNull();
  });
});

import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

// ── browser API stubs ─────────────────────────────────────────────────────────
beforeAll(() => {
  if (typeof globalThis.IntersectionObserver === "undefined") {
    globalThis.IntersectionObserver = class {
      constructor(_cb: IntersectionObserverCallback) {}
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
  }
});

// ── sub-organism mocks (keep render surface focused) ─────────────────────────
vi.mock("@/components/organisms/MiMundoHero", () => ({
  MiMundoHero: () => <section data-testid="mm-hero" />,
}));

vi.mock("@/components/organisms/MiMundoSalasGrid", () => ({
  MiMundoSalasGrid: () => <section data-testid="mm-salas-grid" />,
}));

vi.mock("@/components/organisms/MiMundoLandingGallery", () => ({
  MiMundoLandingGallery: () => <section data-testid="mm-gallery" />,
}));

vi.mock("@/components/organisms/MiMundoLandingContactPanel", () => ({
  MiMundoLandingContactPanel: () => <section data-testid="mm-contact-panel" />,
}));

vi.mock("@/components/molecules/LanguageSwitcher", () => ({
  LanguageSwitcher: () => <div data-testid="mm-lang-switcher" />,
}));

// ── component under test (imported after mocks) ───────────────────────────────
import { LandingMimundoSections } from "@/components/organisms/LandingMimundoSections";

const defaultProps = {
  dict: dictEn,
  brand: {
    ...mockBrandPublic,
    socialFacebook: "https://facebook.com/mimundo",
    socialInstagram: "https://instagram.com/mimundo",
    logoPath: "/images/mimundo/logo/logo.png",
    legalName: "Jardín Maternal Mi Mundo S.A.",
  },
  locale: "en",
};

describe("LandingMimundoSections — smoke", () => {
  it("renders the four main sub-sections", () => {
    render(<LandingMimundoSections {...defaultProps} />);
    expect(screen.getByTestId("mm-hero")).toBeInTheDocument();
    expect(screen.getByTestId("mm-salas-grid")).toBeInTheDocument();
    expect(screen.getByTestId("mm-gallery")).toBeInTheDocument();
    expect(screen.getByTestId("mm-contact-panel")).toBeInTheDocument();
  });

  it("renders the CTA register link to /en/register", () => {
    render(<LandingMimundoSections {...defaultProps} />);
    const links = screen.getAllByRole("link");
    const registerLink = links.find((l) => l.getAttribute("href") === "/en/register");
    expect(registerLink).toBeDefined();
  });

  it("footer renders social links when brand provides them", () => {
    render(<LandingMimundoSections {...defaultProps} />);
    const fbLink = screen.getByRole("link", {
      name: (n) => n.toLowerCase().includes("facebook"),
    });
    expect(fbLink).toHaveAttribute("href", "https://facebook.com/mimundo");
    const igLink = screen.getByRole("link", {
      name: (n) => n.toLowerCase().includes("instagram"),
    });
    expect(igLink).toHaveAttribute("href", "https://instagram.com/mimundo");
  });

  it("footer omits social links when brand has empty URLs", () => {
    render(
      <LandingMimundoSections
        {...defaultProps}
        brand={{ ...defaultProps.brand, socialFacebook: "", socialInstagram: "" }}
      />,
    );
    const links = screen.getAllByRole("link");
    for (const l of links) {
      expect(l.getAttribute("href")).not.toMatch(/facebook|instagram/);
    }
  });

  it("renders language switcher in footer", () => {
    render(<LandingMimundoSections {...defaultProps} />);
    expect(screen.getByTestId("mm-lang-switcher")).toBeInTheDocument();
  });
});

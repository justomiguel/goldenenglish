import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Dictionary } from "@/types/i18n";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { LandingHero } from "@/components/organisms/LandingHero";
import { LandingStory } from "@/components/organisms/LandingStory";
import { LandingHeader } from "@/components/organisms/LandingHeader";
import { LandingFooter } from "@/components/organisms/LandingFooter";
import { LandingHeaderPwa } from "@/components/pwa/molecules/LandingHeaderPwa";
import { LandingFooterPwa } from "@/components/pwa/molecules/LandingFooterPwa";
import { RegisterSiteHeader } from "@/components/molecules/RegisterSiteHeader";
import { LoginHeroPanel } from "@/components/molecules/LoginHeroPanel";
import { RegisterCollage } from "@/components/molecules/RegisterCollage";

const brandRich = {
  ...mockBrandPublic,
  socialWhatsapp: "https://wa.me/1",
  socialInstagram: "https://ig.example",
  socialFacebook: "https://fb.example",
};

describe("landing marketing branches", () => {
  it("LandingHero toggles CTA and WhatsApp by props and brand", () => {
    const { rerender } = render(
      <LandingHero
        dict={dictEn}
        brand={{ ...mockBrandPublic, socialWhatsapp: "" }}
        locale="es"
        sessionEmail={null}
        inscriptionsOpen={false}
      />,
    );
    expect(screen.queryByRole("link", { name: /WhatsApp/i })).not.toBeInTheDocument();
    rerender(
      <LandingHero
        dict={dictEn}
        brand={brandRich}
        locale="es"
        sessionEmail={null}
        inscriptionsOpen
      />,
    );
    expect(screen.getByRole("link", { name: dictEn.landing.hero.ctaRegister })).toHaveAttribute(
      "href",
      "/es/register",
    );
    expect(screen.getByRole("link", { name: /WhatsApp/i })).toHaveAttribute(
      "href",
      brandRich.socialWhatsapp,
    );
    rerender(
      <LandingHero
        dict={dictEn}
        brand={brandRich}
        locale="es"
        sessionEmail="x@y.co"
        inscriptionsOpen={false}
      />,
    );
    expect(
      screen.getByRole("link", { name: dictEn.landing.hero.ctaSignedIn }),
    ).toHaveAttribute("href", "/es#niveles");
  });

  it("LandingStory uses empty alts fallback", () => {
    const dict: Dictionary = {
      ...dictEn,
      landing: {
        ...dictEn.landing,
        collage: { ...dictEn.landing.collage, alts: ["only"] },
      },
    };
    render(<LandingStory dict={dict} brand={mockBrandPublic} />);
    expect(screen.getByText(dict.landing.story.body1)).toBeInTheDocument();
  });

  it("LandingHeader and Footer session + social branches", () => {
    const brand = { ...mockBrandPublic, contactPhone: "", contactEmail: "" };
    render(
      <LandingFooter
        dict={dictEn}
        brand={{ ...brandRich, contactPhone: "", contactEmail: "" }}
        locale="es"
        sessionEmail="a@b.co"
      />,
    );
    expect(screen.getByRole("button", { name: dictEn.nav.logout })).toBeInTheDocument();
    render(
      <LandingHeader
        brand={brand}
        dict={dictEn}
        locale="es"
        sessionEmail="a@b.co"
      />,
    );
    expect(screen.getAllByRole("button", { name: dictEn.nav.logout }).length).toBeGreaterThan(0);
  });

  it("LandingHeaderPwa shows login when logged out", () => {
    render(
      <LandingHeaderPwa
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail={null}
      />,
    );
    expect(screen.getByRole("link", { name: dictEn.nav.login })).toBeInTheDocument();
  });

  it("LandingFooterPwa shows login link", () => {
    render(
      <LandingFooterPwa
        dict={dictEn}
        brand={{
          ...brandRich,
          contactPhone: "",
          socialInstagram: "",
          socialFacebook: "",
        }}
        locale="es"
        sessionEmail={null}
      />,
    );
    expect(screen.getByRole("link", { name: dictEn.nav.login })).toBeInTheDocument();
  });

  it("RegisterSiteHeader links home", () => {
    render(<RegisterSiteHeader brand={mockBrandPublic} locale="es" dict={dictEn} />);
    expect(screen.getByRole("link", { name: dictEn.nav.home })).toBeInTheDocument();
  });

  it("LoginHeroPanel omits tagline when empty", () => {
    const b = {
      ...mockBrandPublic,
      tagline: "",
      taglineEn: "",
    };
    const { container } = render(<LoginHeroPanel brand={b} locale="en" />);
    expect(container.querySelector("p")).toBeNull();
  });

  it("RegisterCollage renders grid", () => {
    render(<RegisterCollage alts={["a", "b", "c", "d"]} />);
    expect(document.querySelector(".grid")).toBeTruthy();
  });
});

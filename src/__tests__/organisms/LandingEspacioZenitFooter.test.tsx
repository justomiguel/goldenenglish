import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingEspacioZenitFooter } from "@/components/organisms/LandingEspacioZenitFooter";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

const dict = dictEs as Dictionary;

describe("LandingEspacioZenitFooter", () => {
  it("shows contact phone from site setup (brand), not dictionary placeholder", () => {
    const setupPhone = "+56 9 8765 4321";
    const dictPhone = dict.landing.ez.contact.phoneDisplay;

    render(
      <LandingEspacioZenitFooter
        dict={dict}
        locale="es"
        logoSrc="/images/logo.png"
        logoAlt="Logo"
        brand={{ ...mockBrandPublic, contactPhone: setupPhone }}
        sessionEmail={null}
      />,
    );

    expect(screen.getByRole("link", { name: setupPhone })).toHaveAttribute(
      "href",
      "tel:+56987654321",
    );
    expect(screen.queryByText(dictPhone)).not.toBeInTheDocument();
  });

  it("shows panel and logout in footer on mobile when logged in", () => {
    render(
      <LandingEspacioZenitFooter
        dict={dict}
        locale="es"
        logoSrc="/images/logo.png"
        logoAlt="Logo"
        brand={mockBrandPublic}
        sessionEmail="staff@example.com"
      />,
    );

    expect(
      screen.getByRole("link", { name: dict.nav.administration }),
    ).toHaveAttribute("href", "/es/dashboard");
    expect(
      screen.getByRole("button", { name: dict.nav.logout }),
    ).toBeInTheDocument();
  });
});

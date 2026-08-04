import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingLioraFooter } from "@/components/organisms/LandingLioraFooter";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import { LIORA_SEDE_KEYS } from "@/lib/landing/lioraSchedule";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";

const dict = dictEs as Dictionary;
const t = (path: string) => marketingLandingCopy(dict, "liora", path);

function renderFooter(brandOverrides: Partial<typeof mockBrandPublic> = {}) {
  return render(
    <LandingLioraFooter
      dict={dict}
      brand={{ ...mockBrandPublic, ...brandOverrides }}
      locale="es"
      t={t}
    />,
  );
}

describe("LandingLioraFooter", () => {
  it("lists every sede with its nearest metro", () => {
    renderFooter();

    for (const sedeKey of LIORA_SEDE_KEYS) {
      expect(screen.getByText(t(`sedes.${sedeKey}.name`))).toBeInTheDocument();
      expect(screen.getByText(t(`sedes.${sedeKey}.metro`))).toBeInTheDocument();
    }
  });

  it("renders the site setup phone as a tel link", () => {
    const setupPhone = "+56 9 8765 4321";
    renderFooter({ contactPhone: setupPhone });

    expect(screen.getByRole("link", { name: setupPhone })).toHaveAttribute(
      "href",
      "tel:+56987654321",
    );
  });

  it("prefers the site setup social URLs over the dictionary ones", () => {
    renderFooter({
      socialInstagram: "https://instagram.com/liora-real",
      socialWhatsapp: "https://wa.me/56911112222",
    });

    expect(
      screen.getByRole("link", { name: t("chrome.instagramAria") }),
    ).toHaveAttribute("href", "https://instagram.com/liora-real");
    expect(
      screen.getByRole("link", { name: t("chrome.whatsappAria") }),
    ).toHaveAttribute("href", "https://wa.me/56911112222");
  });

  it("falls back to the dictionary social URLs when site setup is empty", () => {
    renderFooter({ socialInstagram: "", socialWhatsapp: "" });

    expect(
      screen.getByRole("link", { name: t("chrome.instagramAria") }),
    ).toHaveAttribute("href", t("contact.instagramUrl"));
  });

  it("omits the contact block when neither phone nor email is configured", () => {
    const { container } = renderFooter({ contactPhone: "", contactEmail: "" });

    expect(container.querySelector('a[href^="tel:"]')).toBeNull();
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it("renders the configured email as a mailto link", () => {
    renderFooter({ contactEmail: "hola@liorastudio.cl" });

    expect(
      screen.getByRole("link", { name: "hola@liorastudio.cl" }),
    ).toHaveAttribute("href", "mailto:hola@liorastudio.cl");
  });
});

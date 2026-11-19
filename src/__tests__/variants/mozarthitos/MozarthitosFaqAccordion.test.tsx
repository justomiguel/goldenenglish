import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { LandingMozarthitosContactSection } from "@/variants/owned/mozarthitos/pieces/LandingMozarthitosContactSection";
import { MozarthitosFaqAccordion } from "@/variants/owned/mozarthitos/pieces/MozarthitosFaqAccordion";
import { MOZARTHITOS_ADMISSION_WHATSAPP_URL } from "@/variants/owned/mozarthitos/pieces/mozarthitosAdmissionWhatsApp";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock("@/components/molecules/PublicContactForm", () => ({
  PublicContactForm: () => <form aria-label="contact-form" />,
}));

beforeAll(() => {
  if (typeof globalThis.IntersectionObserver === "undefined") {
    globalThis.IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof IntersectionObserver;
  }
});

const dict = dictEs as Dictionary;

describe("MozarthitosFaqAccordion", () => {
  it("keeps every approved answer closed until the question is opened", () => {
    const items = dict.publicAnswers.kinds.mozarthitos.items;
    render(<MozarthitosFaqAccordion items={items} />);
    const details = document.querySelectorAll("details");
    expect(Array.from(details, (node) => node.querySelector("h2")?.textContent)).toEqual(
      items.map((item) => item.q),
    );
    for (const node of details) {
      expect(node.hasAttribute("open")).toBe(false);
    }
    expect(details[0]?.textContent).toContain("matrícula");
    expect(document.querySelector('img[src="/images/mozarthitos/inicio/2.png"]')).toBeTruthy();
    expect(document.querySelector('img[src="/images/mozarthitos/oferta/1.png"]')).toBeTruthy();
    expect(screen.getByRole("link", { name: MOZARTHITOS_ADMISSION_WHATSAPP_URL, hidden: true })).toHaveAttribute(
      "href",
      MOZARTHITOS_ADMISSION_WHATSAPP_URL,
    );
  });
});

describe("LandingMozarthitosContactSection", () => {
  it("uses the approved admissions chat and lists every question closed", () => {
    render(
      <LandingMozarthitosContactSection
        dict={dict}
        locale="es"
        igUrl="https://www.instagram.com/mozarthitos/"
      />,
    );
    expect(screen.getByRole("link", { name: "+56 9 5991 6314" })).toHaveAttribute(
      "href",
      MOZARTHITOS_ADMISSION_WHATSAPP_URL,
    );
    const details = document.querySelectorAll("#contacto details");
    expect(details).toHaveLength(dict.publicAnswers.kinds.mozarthitos.items.length);
    for (const node of details) {
      expect(node.hasAttribute("open")).toBe(false);
    }
  });
});

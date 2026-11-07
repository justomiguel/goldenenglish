import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => "/es/precios",
  useSearchParams: () => new URLSearchParams(),
}));
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { PulsarPricingView } from "@/components/organisms/pulsar/PulsarPricingView";
import { applyCentrolistoMarketDictionary } from "@/lib/pulsar/applyCentrolistoMarketDictionary";
import { formatOfferAmount } from "@/lib/pulsar/centrolistoCommercialOffer";

const dict = es as unknown as Dictionary;

describe("PulsarPricingView", () => {
  it("shows the Chile offer, the template rule, and real conversion links", () => {
    render(<PulsarPricingView locale="es" dict={dict} />);

    expect(screen.getByRole("heading", { name: dict.pulsar.pricing.title })).toBeInTheDocument();
    expect(screen.getAllByText(dict.pulsar.pricing.free).length).toBeGreaterThan(0);
    expect(screen.getAllByText(dict.pulsar.pricing.withTemplates).length).toBeGreaterThan(0);
    expect(screen.getAllByText(dict.pulsar.pricing.templateRule).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatOfferAmount(29990, "cl")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatOfferAmount(69990, "cl")).length).toBeGreaterThan(0);
    expect(screen.queryByText(formatOfferAmount(49990, "cl"))).toBeNull();
    expect(screen.getAllByText(new RegExp(formatOfferAmount(149990, "cl").replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))).length).toBeGreaterThan(0);
    expect(screen.queryByText("44.900")).toBeNull();
    expect(screen.queryByText("Hasta 120 alumnos activos.")).toBeNull();
    expect(screen.getByText("Sin alumnos en el plan gratis")).toBeInTheDocument();
    expect(screen.queryByText("300")).toBeNull();

    const signup = screen.getAllByRole("link", { name: dict.pulsar.solutionSet.presencia.cta });
    for (const link of signup) expect(link).toHaveAttribute("href", "/es/cuenta/registro");
    expect(screen.getByRole("link", { name: dict.pulsar.solutionSet.gestion.cta })).toHaveAttribute(
      "href",
      "/es/contacto?interes=gestion",
    );
    expect(screen.getByRole("link", { name: dict.pulsar.solutionSet.ecosistema.cta })).toHaveAttribute(
      "href",
      "/es/contacto?interes=ecosistema",
    );
    const quotes = screen.getAllByRole("link", { name: dict.pulsar.pricing.customCta });
    for (const link of quotes) expect(link).toHaveAttribute("href", "/es/contacto?interes=medida");
    expect(screen.getByText(dict.pulsar.pricing.faqs[0].q)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: dict.pulsar.market.cl })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText("Hasta 50 alumnos activos.")).toBeNull();
    expect(screen.getAllByText(/rutas de cursos/).length).toBeGreaterThan(0);
  });

  it("shows Argentina amounts and voseo when the market is ar", () => {
    const arDict = applyCentrolistoMarketDictionary(dict, "es", "ar");
    render(<PulsarPricingView locale="es" dict={arDict} market="ar" />);
    const text = document.body.textContent?.replace(/[\s\u00a0\u202f]/g, "") ?? "";
    expect(text).toContain("44.900");
    expect(text).toContain("99.900");
    expect(text).not.toContain("46.400");
    expect(text).not.toContain("108.400");
    expect(text).toContain("232.300");
    expect(document.body.textContent).toContain("Podés crear");
    expect(screen.getByRole("radio", { name: arDict.pulsar.market.ar })).toHaveAttribute("aria-checked", "true");
    const pricingLinks = screen.getAllByRole("link", { name: dict.pulsar.nav.pricing });
    expect(pricingLinks.some((link) => link.getAttribute("href") === "/es/precios?pais=ar")).toBe(true);
  });
});

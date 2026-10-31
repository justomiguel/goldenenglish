import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { PulsarPricingView } from "@/components/organisms/pulsar/PulsarPricingView";
import { formatOfferAmount } from "@/lib/pulsar/centrolistoCommercialOffer";

const dict = es as unknown as Dictionary;

describe("PulsarPricingView", () => {
  it("shows the Chile offer, the template rule, and real conversion links", () => {
    render(<PulsarPricingView locale="es" dict={dict} />);

    expect(screen.getByRole("heading", { name: dict.pulsar.pricing.title })).toBeInTheDocument();
    expect(screen.getAllByText(dict.pulsar.pricing.free).length).toBeGreaterThan(0);
    expect(screen.getAllByText(dict.pulsar.pricing.withTemplates).length).toBeGreaterThan(0);
    expect(screen.getAllByText(dict.pulsar.pricing.templateRule).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatOfferAmount(29990, "es")).length).toBeGreaterThan(0);
    expect(screen.getAllByText(formatOfferAmount(69990, "es")).length).toBeGreaterThan(0);
    expect(
      screen.getByText(`${formatOfferAmount(49990, "es")} ${dict.pulsar.pricing.oneTimeTax}`),
    ).toBeInTheDocument();
    expect(
      screen.getByText(`${formatOfferAmount(149990, "es")} ${dict.pulsar.pricing.oneTimeTax}`),
    ).toBeInTheDocument();
    expect(screen.queryByText("44.900")).toBeNull();
    expect(screen.queryByText("120")).toBeNull();
    expect(screen.queryByText("300")).toBeNull();

    const signup = screen.getAllByRole("link", { name: dict.pulsar.solutionSet.presencia.cta });
    for (const link of signup) expect(link).toHaveAttribute("href", "/es/cuenta/registro");
    expect(screen.getByRole("link", { name: dict.pulsar.solutionSet.gestion.cta })).toHaveAttribute(
      "href",
      "/es/contacto",
    );
    expect(screen.getByRole("link", { name: dict.pulsar.solutionSet.ecosistema.cta })).toHaveAttribute(
      "href",
      "/es/contacto",
    );
    const quotes = screen.getAllByRole("link", { name: dict.pulsar.pricing.customCta });
    for (const link of quotes) expect(link).toHaveAttribute("href", "/es/contacto");
    expect(screen.getByText(dict.pulsar.pricing.faqs[0].q)).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { PulsarSolutionView } from "@/components/organisms/pulsar/PulsarSolutionView";

const dict = es as unknown as Dictionary;

describe("PulsarSolutionView", () => {
  it("sends Presencia to free registration and does not borrow a testimonial", () => {
    render(<PulsarSolutionView locale="es" dict={dict} solution="presencia" />);

    expect(screen.getByRole("heading", { name: dict.pulsar.solutionSet.presencia.headline })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: dict.pulsar.home.freeSiteCta })).toHaveAttribute(
      "href",
      "/es/cuenta/registro",
    );
    expect(screen.queryByText(dict.pulsar.clients.voices[0].quote)).toBeNull();
    expect(screen.queryByText(dict.pulsar.home.faqTitle)).toBeNull();
  });

  it("keeps the payment voices, the problem, and the comparison on Gestión", () => {
    render(<PulsarSolutionView locale="es" dict={dict} solution="gestion" />);

    expect(screen.getByText(dict.pulsar.clients.voices[2].quote)).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.clients.voices[3].quote)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: dict.pulsar.commercial.problemTitle })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: dict.pulsar.home.faqTitle })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: dict.pulsar.product.comparison.title })).toBeInTheDocument();
  });
});

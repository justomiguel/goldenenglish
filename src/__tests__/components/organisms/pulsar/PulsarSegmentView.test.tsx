// REGRESSION CHECK: Segment pages keep real testimonials intact and only on the matching craft.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { PulsarSegmentView } from "@/components/organisms/pulsar/PulsarSegmentView";

const dict = es as unknown as Dictionary;

describe("PulsarSegmentView", () => {
  it("renders the dance page without borrowing another person's quote", () => {
    render(<PulsarSegmentView locale="es" dict={dict} segment="danza" />);

    expect(screen.getByRole("heading", { name: dict.pulsar.segments.danza.h1 })).toBeInTheDocument();
    expect(screen.queryByText(dict.pulsar.clients.voices[0].quote)).toBeNull();
    const demoLinks = screen.getAllByRole("link", { name: dict.pulsar.segments.danza.cta });
    expect(demoLinks.length).toBeGreaterThan(0);
    for (const link of demoLinks) {
      expect(link).toHaveAttribute("href", "/es/contacto");
    }
  });

  it("keeps Camila's music quote unchanged on the music page", () => {
    render(<PulsarSegmentView locale="es" dict={dict} segment="musica" />);

    const voice = dict.pulsar.clients.voices[0];
    expect(screen.getByText(voice.quote)).toBeInTheDocument();
    expect(screen.getByText(`${voice.name} · ${voice.role}`)).toBeInTheDocument();
  });
});

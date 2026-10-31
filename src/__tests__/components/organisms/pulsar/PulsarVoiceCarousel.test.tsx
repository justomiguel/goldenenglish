import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { PulsarVoiceCarousel } from "@/components/organisms/pulsar/PulsarVoiceCarousel";

const dict = es as unknown as Dictionary;

describe("PulsarVoiceCarousel", () => {
  it("shows every client voice without hiding quotes in a carousel", () => {
    render(<PulsarVoiceCarousel dict={dict} />);

    expect(dict.pulsar.clients.voices).toHaveLength(6);
    for (const voice of dict.pulsar.clients.voices) {
      expect(screen.getByText(voice.quote)).toBeInTheDocument();
      expect(screen.getByText(voice.name)).toBeInTheDocument();
      expect(screen.getByText(voice.role)).toBeInTheDocument();
    }
    expect(screen.getByRole("button", { name: dict.pulsar.clients.voicesNext })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: dict.pulsar.clients.voicesPrev })).toBeInTheDocument();
  });
});

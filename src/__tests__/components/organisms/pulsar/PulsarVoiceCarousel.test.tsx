import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { PulsarVoiceCarousel } from "@/components/organisms/pulsar/PulsarVoiceCarousel";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

const dict = es as unknown as Dictionary;

describe("PulsarVoiceCarousel", () => {
  it("advances to the next opinion", async () => {
    const user = userEvent.setup();
    render(<PulsarVoiceCarousel dict={dict} />);

    expect(screen.getByText("1 de 6")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: dict.pulsar.clients.voicesNext }));
    expect(screen.getByText("2 de 6")).toBeInTheDocument();
    expect(screen.getByText(dict.pulsar.clients.voices[1].role)).toBeInTheDocument();
  });
});

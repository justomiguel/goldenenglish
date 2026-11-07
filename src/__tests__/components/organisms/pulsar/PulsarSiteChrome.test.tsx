// REGRESSION CHECK: The current header item must stay shaded and marked.
// Footer links with the same label must stay unmarked.
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/es/precios",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/app/[locale]/admin/sessionActions", () => ({
  signOutPulsarSessionAction: vi.fn(),
}));

import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { PulsarSiteChrome } from "@/components/organisms/pulsar/PulsarSiteChrome";

const dict = es as unknown as Dictionary;

describe("PulsarSiteChrome", () => {
  it("shades the header item for the current page", () => {
    render(
      <PulsarSiteChrome locale="es" dict={dict} activeNav="pricing">
        <p>page</p>
      </PulsarSiteChrome>,
    );

    const header = screen.getByRole("banner");
    const current = within(header).getByRole("link", { name: dict.pulsar.nav.pricing });
    const home = within(header).getByRole("link", { name: dict.pulsar.nav.home });

    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveClass("bg-[var(--color-muted)]");
    expect(home).not.toHaveAttribute("aria-current");
    expect(home).not.toHaveClass("bg-[var(--color-muted)]");

    const footer = screen.getByRole("contentinfo");
    const footerPrices = within(footer).getAllByRole("link", { name: dict.pulsar.nav.pricing });
    expect(footerPrices.length).toBeGreaterThan(0);
    for (const link of footerPrices) {
      expect(link).not.toHaveAttribute("aria-current");
    }
  });
});

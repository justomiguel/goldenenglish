// REGRESSION CHECK: The country select writes the cookie and keeps other query keys.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replace = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  usePathname: () => "/es",
  useSearchParams: () => new URLSearchParams("utm=1"),
}));

import es from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { CentrolistoMarketPicker } from "@/components/organisms/pulsar/CentrolistoMarketPicker";

const dict = es as unknown as Dictionary;

describe("CentrolistoMarketPicker", () => {
  it("replaces the URL with the chosen country and keeps other query keys", () => {
    replace.mockClear();
    render(<CentrolistoMarketPicker market="cl" copy={dict.pulsar.market} />);
    fireEvent.change(screen.getByRole("combobox", { name: dict.pulsar.market.label }), {
      target: { value: "ar" },
    });
    expect(replace).toHaveBeenCalledWith("/es?utm=1&pais=ar");
    expect(document.cookie).toContain("centrolisto_market=ar");
  });
});

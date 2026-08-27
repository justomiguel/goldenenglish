import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("next/font/google", () => ({
  Cinzel: () => ({ variable: "--font-nago-display" }),
  Outfit: () => ({ variable: "--font-nago-body" }),
}));

import { NagoFontRoot } from "@/components/organisms/NagoFontRoot";

describe("NagoFontRoot", () => {
  it("lays a film-grain overlay over the public surface", () => {
    const { container } = render(
      <NagoFontRoot>
        <p>Nagô</p>
      </NagoFontRoot>,
    );
    expect(container.querySelector(".nago-grain")).toBeTruthy();
  });
});

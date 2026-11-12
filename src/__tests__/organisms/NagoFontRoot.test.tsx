import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@/components/atoms/fonts/catalogFonts", () => ({
  CATALOG_FONTS: {
    oswald: { className: "cls-oswald", variable: "--font-catalog-oswald" },
    outfit: { className: "cls-outfit", variable: "--font-catalog-outfit" },
  },
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

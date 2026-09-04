import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingHeader } from "@/components/organisms/LandingHeader";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("LandingHeader merch link", () => {
  it("shows shop label only when merchEnabled", () => {
    const { rerender } = render(
      <LandingHeader
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail={null}
      />,
    );
    expect(screen.queryByRole("link", { name: dictEn.shop.catalog.title })).toBeNull();

    rerender(
      <LandingHeader
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail={null}
        merchEnabled
      />,
    );
    expect(screen.getByRole("link", { name: dictEn.shop.catalog.title })).toHaveAttribute(
      "href",
      "/es/tienda",
    );
  });
});

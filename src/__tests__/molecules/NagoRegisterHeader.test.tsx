import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { NagoRegisterHeader } from "@/components/molecules/NagoRegisterHeader";
import { dictEn } from "@/test/dictEn";

describe("NagoRegisterHeader", () => {
  it("renders the logo without a cream plate", () => {
    render(
      <NagoRegisterHeader
        locale="es"
        logoSrc="/images/logo.png"
        logoAlt="Capoeira Nagô"
        dict={dictEn}
      />,
    );
    const logo = screen.getByRole("link", { name: "Capoeira Nagô" });
    expect(logo.className).not.toMatch(/nago-heading-solid/);
  });
});

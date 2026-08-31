import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/organisms/NagoFontRoot", () => ({
  NagoFontRoot: ({ children }: { children: ReactNode }) => (
    <div data-testid="nago-font-root">{children}</div>
  ),
}));

vi.mock("@/components/register/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form-stub" />,
}));

import { RegisterNagoSurface } from "@/components/organisms/RegisterNagoSurface";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("RegisterNagoSurface", () => {
  it("shows nago shell title", () => {
    render(
      <RegisterNagoSurface
        locale="es"
        dict={dictEn}
        brand={mockBrandPublic}
        legalAgeMajority={18}
        sectionOptions={[{ id: "a", label: "A" }]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      dictEn.landing.nago.register.shellTitle,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      dictEn.landing.nago.hero.title,
    );
    expect(screen.getByTestId("register-form-stub")).toBeInTheDocument();
    const sheet = screen.getByTestId("register-form-stub").parentElement;
    expect(sheet).toHaveClass("nago-public-sheet", "w-full");
    expect(sheet).not.toHaveClass("max-w-lg");
    expect(sheet?.parentElement?.parentElement).toHaveClass("flex-col");
    expect(sheet?.parentElement?.parentElement).not.toHaveClass("lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]");
  });
});

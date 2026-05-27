import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/organisms/MiMundoFontRoot", () => ({
  MiMundoFontRoot: ({ children }: { children: ReactNode }) => (
    <div data-testid="mm-font-root">{children}</div>
  ),
}));

vi.mock("@/components/molecules/MiMundoRegisterHeader", () => ({
  MiMundoRegisterHeader: () => <div data-testid="mm-register-header" />,
}));

vi.mock("@/components/molecules/MiMundoFloatingDoodles", () => ({
  MiMundoFloatingDoodles: () => <div data-testid="mm-doodles" />,
}));

vi.mock("@/components/molecules/MiMundoCursorTrail", () => ({
  MiMundoCursorTrail: () => <div data-testid="mm-cursor-trail" />,
}));

vi.mock("@/components/molecules/MiMundoButterflyTrails", () => ({
  MiMundoButterflyTrails: () => <div data-testid="mm-butterflies" />,
}));

vi.mock("@/components/register/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form-stub" />,
}));

import { RegisterMiMundoSurface } from "@/components/organisms/RegisterMiMundoSurface";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("RegisterMiMundoSurface", () => {
  it("renders the Mi Mundo themed shell with form, figure copy and chrome", () => {
    render(
      <RegisterMiMundoSurface
        locale="es"
        dict={dictEn}
        brand={mockBrandPublic}
        legalAgeMajority={18}
        sectionOptions={[{ id: "a", label: "A" }]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      dictEn.landing.mm.register.shellTitle,
    );
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      dictEn.landing.mm.register.figureTitle,
    );

    expect(screen.getByTestId("register-form-stub")).toBeInTheDocument();
    expect(screen.getByTestId("mm-font-root")).toBeInTheDocument();
    expect(screen.getByTestId("mm-register-header")).toBeInTheDocument();
    expect(screen.getByTestId("mm-doodles")).toBeInTheDocument();
    expect(screen.getByTestId("mm-cursor-trail")).toBeInTheDocument();
    expect(screen.getByTestId("mm-butterflies")).toBeInTheDocument();

    expect(
      screen.getByText(dictEn.landing.mm.register.figureBullets.play),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dictEn.landing.mm.register.figureBullets.nature),
    ).toBeInTheDocument();
    expect(
      screen.getByText(dictEn.landing.mm.register.figureBullets.care),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: dictEn.landing.mm.register.loginCta }),
    ).toBeInTheDocument();
  });
});

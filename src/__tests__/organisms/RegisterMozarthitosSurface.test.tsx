import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/organisms/MozarthitosFontRoot", () => ({
  MozarthitosFontRoot: ({ children }: { children: ReactNode }) => (
    <div data-testid="mz-font-root">{children}</div>
  ),
}));

vi.mock("@/components/molecules/MozarthitosReveal", () => ({
  MozarthitosReveal: ({ children }: { children: ReactNode }) => (
    <div data-testid="mz-reveal-stub">{children}</div>
  ),
}));

vi.mock("@/components/register/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form-stub" />,
}));

import { RegisterMozarthitosSurface } from "@/components/organisms/RegisterMozarthitosSurface";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("RegisterMozarthitosSurface", () => {
  it("shows mozarthitos shell title", () => {
    render(
      <RegisterMozarthitosSurface
        locale="es"
        dict={dictEn}
        brand={mockBrandPublic}
        legalAgeMajority={18}
        sectionOptions={[{ id: "a", label: "A" }]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      dictEn.landing.mz.register.shellTitle,
    );
    expect(screen.getByTestId("register-form-stub")).toBeInTheDocument();
  });
});

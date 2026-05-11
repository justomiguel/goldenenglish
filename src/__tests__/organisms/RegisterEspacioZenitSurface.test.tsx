import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/organisms/EspacioZenitFontRoot", () => ({
  EspacioZenitFontRoot: ({ children }: { children: ReactNode }) => (
    <div data-testid="ez-font-root">{children}</div>
  ),
}));

import { RegisterEspacioZenitSurface } from "@/components/organisms/RegisterEspacioZenitSurface";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

vi.mock("@/components/register/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form-stub" />,
}));

describe("RegisterEspacioZenitSurface", () => {
  it("shows zenit shell title and defers to RegisterForm", () => {
    render(
      <RegisterEspacioZenitSurface
        locale="es"
        dict={dictEn}
        brand={mockBrandPublic}
        legalAgeMajority={18}
        sectionOptions={[{ id: "a", label: "A" }]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      dictEn.landing.ez.register.shellTitle,
    );
    expect(screen.getByTestId("register-form-stub")).toBeInTheDocument();
  });
});

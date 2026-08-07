import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/organisms/LioraFontRoot", () => ({
  LioraFontRoot: ({ children }: { children: ReactNode }) => (
    <div data-testid="liora-font-root">{children}</div>
  ),
}));

vi.mock("@/components/register/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form-stub" />,
}));

import { RegisterLioraSurface } from "@/components/organisms/RegisterLioraSurface";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("RegisterLioraSurface", () => {
  it("shows liora shell title", () => {
    render(
      <RegisterLioraSurface
        locale="es"
        dict={dictEn}
        brand={mockBrandPublic}
        legalAgeMajority={18}
        sectionOptions={[{ id: "a", label: "A" }]}
      />,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      dictEn.landing.liora.register.shellTitle,
    );
    expect(screen.getByTestId("register-form-stub")).toBeInTheDocument();
  });
});

import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";

vi.mock("@/variants/owned/matiss/font/v1/Web", () => ({
  MatissFontRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/register/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form-stub" />,
}));

import { RegisterMatissSurface } from "@/variants/owned/matiss/register/v1/Web";
import es from "@/dictionaries/es.json";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("RegisterMatissSurface", () => {
  it("uses the trial title when the intent is a trial class", () => {
    render(
      <RegisterMatissSurface
        locale="es"
        dict={es}
        brand={mockBrandPublic}
        legalAgeMajority={18}
        sectionOptions={[{ id: "a", label: "A" }]}
        intent="trial"
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      es.register.trial.shellTitle,
    );
    expect(screen.getByTestId("register-form-stub")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute(
      "src",
      expect.stringContaining("/images/matiss/fotos/roja.jpg"),
    );
  });
});

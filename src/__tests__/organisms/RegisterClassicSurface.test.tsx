// REGRESSION CHECK: Classic Golden register is a reception desk on desktop and form-only below lg.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/register/RegisterForm", () => ({
  RegisterForm: () => <div data-testid="register-form-stub" />,
}));

vi.mock("@/components/molecules/RegisterCollage", () => ({
  RegisterCollage: () => <div data-testid="register-collage-stub" />,
}));

import { RegisterClassicSurface } from "@/components/organisms/RegisterClassicSurface";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

describe("RegisterClassicSurface", () => {
  it("shows the reception figure on desktop and a paper sheet around the form", () => {
    const copy = dictEn.landing.classic.register;
    render(
      <RegisterClassicSurface
        locale="es"
        dict={dictEn}
        brand={mockBrandPublic}
        legalAgeMajority={18}
        sectionOptions={[{ id: "a", label: "A" }]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.shellTitle);
    expect(screen.getByText(copy.shellLead)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(copy.figureTitle);
    expect(screen.getByText(copy.figureLead)).toBeInTheDocument();
    expect(screen.getByTestId("register-collage-stub")).toBeInTheDocument();
    expect(screen.getByTestId("register-form-stub")).toBeInTheDocument();

    const figure = screen.getByRole("heading", { level: 2 }).closest("aside");
    expect(figure).toHaveClass("hidden", "lg:block");

    const sheet = screen.getByTestId("register-form-stub").parentElement;
    expect(sheet).toHaveClass("bg-[var(--color-surface)]", "w-full");
    expect(sheet).not.toHaveClass("max-w-lg");

    const desk = figure?.parentElement;
    expect(desk).toHaveClass("lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.15fr)]");
  });
});

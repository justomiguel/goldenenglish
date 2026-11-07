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
  RegisterForm: ({ formExtras }: { formExtras?: ReactNode }) => (
    <form data-testid="register-form-stub">{formExtras}</form>
  ),
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
    const sheet = screen.getByTestId("register-form-stub").parentElement;
    expect(sheet).toHaveClass("mz-public-sheet", "w-full");
    expect(sheet).not.toHaveClass("max-w-lg");
    expect(screen.getByTestId("register-form-stub").querySelector('input[name="mz_guide"]')).toBeNull();
  });

  it("puts the guide choice into the form and shows the summary", () => {
    render(
      <RegisterMozarthitosSurface
        locale="en"
        dict={dictEn}
        brand={mockBrandPublic}
        legalAgeMajority={18}
        sectionOptions={[{ id: "a", label: "A" }]}
        extrasPack="mozarthitos"
        guide={{ stage: "little_musicians", modality: "live_online", ageBand: "3y_4y" }}
      />,
    );
    const hidden = screen
      .getByTestId("register-form-stub")
      .querySelector<HTMLInputElement>('input[name="mz_guide"]');
    expect(hidden?.value).toBe("little_musicians.live_online.3y_4y");
    const guide = dictEn.landing.mz.guide;
    expect(
      screen.getByText(
        guide.registerSummary
          .replace("{stage}", guide.stage.little_musicians.title)
          .replace("{modality}", guide.offer.live_online.title),
      ),
    ).toBeInTheDocument();
  });
});

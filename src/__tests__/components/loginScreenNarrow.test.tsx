// REGRESSION CHECK: The PWA login surface reuses the shared LoginForm so the
// single identifier input (email or DNI) must reach standalone-PWA users
// too — regression here would mean parents/students on the installed app
// still see only an email field while desktop offers DNI (Tier A
// inconsistency, regla 05-pwa-mobile-native).

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { LoginScreenNarrow } from "@/components/pwa/organisms/LoginScreenNarrow";

vi.mock("@/hooks/useLogin", () => ({
  useLogin: () => ({
    identifier: "",
    password: "",
    rememberMe: false,
    error: null,
    redirecting: false,
    isLoading: false,
    setIdentifier: vi.fn(),
    setPassword: vi.fn(),
    setRememberMe: vi.fn(),
    handleSubmit: vi.fn(),
  }),
}));

describe("LoginScreenNarrow", () => {
  it("omits tagline when brand taglines are empty", () => {
    const brand = { ...mockBrandPublic, tagline: "", taglineEn: "" };
    const { container } = render(
      <LoginScreenNarrow
        brand={brand}
        dict={dictEn}
        locale="es"
        surface="web-mobile"
      />,
    );
    expect(container.querySelector("header p")).toBeNull();
  });

  it("uses pwa-mobile safe-area padding variant", () => {
    const { container } = render(
      <LoginScreenNarrow
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        surface="pwa-mobile"
      />,
    );
    expect(container.querySelector("main")?.className).toContain("pb-[max(1rem");
  });

  it("renders the single identifier input (email or DNI) on the PWA surface", () => {
    render(
      <LoginScreenNarrow
        brand={mockBrandPublic}
        dict={dictEn}
        locale="en"
        surface="pwa-mobile"
      />,
    );
    const input = screen.getByLabelText(
      /email or document/i,
    ) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe("text");
    expect(input.autocomplete).toBe("username");
  });
});

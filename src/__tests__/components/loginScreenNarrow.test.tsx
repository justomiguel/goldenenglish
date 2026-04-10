import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";
import { LoginScreenNarrow } from "@/components/pwa/organisms/LoginScreenNarrow";

vi.mock("@/hooks/useLogin", () => ({
  useLogin: () => ({
    email: "",
    password: "",
    rememberMe: false,
    error: null,
    redirecting: false,
    isLoading: false,
    setEmail: vi.fn(),
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
});

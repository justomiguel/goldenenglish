import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { AppSurface } from "@/hooks/useAppSurface";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

const mockUseAppSurface = vi.fn<() => AppSurface>();
vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => mockUseAppSurface(),
}));

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

import { LandingSurfaceGate } from "@/components/organisms/LandingSurfaceGate";
import { LoginScreenGate } from "@/components/organisms/LoginScreenGate";
import { AdminImportSurfaceGate } from "@/components/organisms/AdminImportSurfaceGate";

describe("surface gates — narrow tree", () => {
  beforeEach(() => {
    mockUseAppSurface.mockReturnValue("web-mobile");
  });

  it("LandingSurfaceGate mounts PWA shell on web-mobile", async () => {
    render(
      <LandingSurfaceGate
        desktop={<div>d</div>}
        main={<main data-testid="main">m</main>}
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail={null}
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(screen.getByTestId("main")).toBeInTheDocument();
  });

  it("LoginScreenGate mounts narrow login on pwa-mobile", async () => {
    mockUseAppSurface.mockReturnValue("pwa-mobile");
    render(
      <LoginScreenGate
        desktop={<div>d</div>}
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
      />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(document.querySelector("main")).toBeTruthy();
  });

  it("AdminImportSurfaceGate mounts ImportStudents narrow", async () => {
    render(
      <AdminImportSurfaceGate locale="en" desktop={<div>d</div>} dict={dictEn} />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(
      screen.getByRole("button", { name: dictEn.admin.import.chooseFile }),
    ).toBeInTheDocument();
  });
});

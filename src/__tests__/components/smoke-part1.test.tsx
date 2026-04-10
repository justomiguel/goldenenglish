import { describe, it, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
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
import { LandingMainSections } from "@/components/organisms/LandingMainSections";
import { LandingScreenDesktop } from "@/components/desktop/organisms/LandingScreenDesktop";
import { LandingHero } from "@/components/organisms/LandingHero";
import { LandingStory } from "@/components/organisms/LandingStory";
import { LandingModalities } from "@/components/organisms/LandingModalities";
import { LandingLevels } from "@/components/organisms/LandingLevels";
import { LandingCertifications } from "@/components/organisms/LandingCertifications";
import { LandingHeader } from "@/components/organisms/LandingHeader";
import { LandingFooter } from "@/components/organisms/LandingFooter";
import { LoginScreenGate } from "@/components/organisms/LoginScreenGate";
import { LoginScreenDesktop } from "@/components/desktop/organisms/LoginScreenDesktop";
import { AdminImportSurfaceGate } from "@/components/organisms/AdminImportSurfaceGate";

describe("component smoke — landing & gates", () => {
  beforeEach(() => {
    mockUseAppSurface.mockReturnValue("web-desktop");
  });

  it("LandingSurfaceGate", () => {
    render(
      <LandingSurfaceGate
        desktop={<div>d</div>}
        main={<div>m</div>}
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail={null}
      />,
    );
  });

  it("LandingMainSections", () => {
    render(
      <LandingMainSections
        dict={dictEn}
        brand={mockBrandPublic}
        locale="es"
        sessionEmail={null}
        inscriptionsOpen
      />,
    );
  });

  it("LandingScreenDesktop", () => {
    render(
      <LandingScreenDesktop
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail={null}
      >
        <div>child</div>
      </LandingScreenDesktop>,
    );
  });

  it("LandingHero", () => {
    render(
      <LandingHero
        dict={dictEn}
        brand={mockBrandPublic}
        locale="es"
        sessionEmail={null}
        inscriptionsOpen
      />,
    );
  });

  it("LandingStory", () => {
    render(<LandingStory dict={dictEn} brand={mockBrandPublic} />);
  });

  it("LandingModalities", () => {
    render(<LandingModalities dict={dictEn} />);
  });

  it("LandingLevels", () => {
    render(<LandingLevels dict={dictEn} />);
  });

  it("LandingCertifications", () => {
    render(
      <LandingCertifications dict={dictEn} brand={mockBrandPublic} />,
    );
  });

  it("LandingHeader", () => {
    render(
      <LandingHeader
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail={null}
      />,
    );
  });

  it("LandingFooter", () => {
    render(
      <LandingFooter
        dict={dictEn}
        brand={mockBrandPublic}
        locale="es"
        sessionEmail={null}
      />,
    );
  });

  it("LoginScreenGate", () => {
    render(
      <LoginScreenGate
        desktop={<div>d</div>}
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
      />,
    );
  });

  it("LoginScreenDesktop", () => {
    render(
      <LoginScreenDesktop
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
      />,
    );
  });

  it("AdminImportSurfaceGate", () => {
    render(
      <AdminImportSurfaceGate
        desktop={<div>d</div>}
        dict={dictEn}
        locale="es"
      />,
    );
  });
});

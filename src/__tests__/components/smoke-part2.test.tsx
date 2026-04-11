import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { mockBrandPublic } from "@/test/fixtures/mockBrandPublic";

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

vi.mock("@/app/[locale]/dashboard/admin/import/actions", () => ({
  bulkImportStudentsFromRows: vi.fn().mockResolvedValue({
    processed: 0,
    createdUsers: 0,
    enrolled: 0,
    paymentsSeeded: 0,
    results: [],
  }),
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandPublic: () => mockBrandPublic,
}));

vi.mock("@/lib/site/publicUrl", () => ({
  getPublicSiteUrl: () => new URL("https://example.com"),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { signOut: vi.fn().mockResolvedValue({ error: null }) },
  }),
}));

import { AdminImportScreenDesktop } from "@/components/desktop/organisms/AdminImportScreenDesktop";
import { AdminImportScreenSkeleton } from "@/components/molecules/AdminImportScreenSkeleton";
import { LandingScreenSkeleton } from "@/components/molecules/LandingScreenSkeleton";
import { LandingSection } from "@/components/molecules/LandingSection";
import { LandingStudentGallery } from "@/components/molecules/LandingStudentGallery";
import { LandingTiltedPhoto } from "@/components/molecules/LandingTiltedPhoto";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import { LoginHeroPanel } from "@/components/molecules/LoginHeroPanel";
import { LoginBranding } from "@/components/molecules/LoginBranding";
import { LoginScreenSkeleton } from "@/components/molecules/LoginScreenSkeleton";
import { PwaServiceWorkerRegister } from "@/components/molecules/PwaServiceWorkerRegister";
import { SignOutButton } from "@/components/molecules/SignOutButton";
import { JsonLdOrganization } from "@/components/molecules/JsonLdOrganization";
import { LandingCefrIntroBanner } from "@/components/molecules/LandingCefrIntroBanner";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { LandingHeaderPwa } from "@/components/pwa/molecules/LandingHeaderPwa";
import { LandingFooterPwa } from "@/components/pwa/molecules/LandingFooterPwa";
import { LoginScreenNarrow } from "@/components/pwa/organisms/LoginScreenNarrow";
import { AdminImportScreenNarrow } from "@/components/pwa/organisms/AdminImportScreenNarrow";

describe("component smoke — molecules & PWA", () => {
  it("AdminImportScreenDesktop", () => {
    render(<AdminImportScreenDesktop dict={dictEn} />);
  });

  it("AdminImportScreenSkeleton", () => {
    render(<AdminImportScreenSkeleton />);
  });

  it("LandingScreenSkeleton", () => {
    render(<LandingScreenSkeleton />);
  });

  it("LandingSection", () => {
    render(
      <LandingSection title="T">
        <p>c</p>
      </LandingSection>,
    );
  });

  it("LandingStudentGallery", () => {
    render(<LandingStudentGallery dict={dictEn} />);
  });

  it("LandingTiltedPhoto", () => {
    render(<LandingTiltedPhoto src="/images/logo.png" alt="a" />);
  });

  it("LanguageSwitcher", () => {
    render(
      <LanguageSwitcher locale="es" labels={dictEn.common.locale} />,
    );
  });

  it("LoginHeroPanel", () => {
    render(<LoginHeroPanel brand={mockBrandPublic} locale="es" />);
  });

  it("LoginBranding", () => {
    render(<LoginBranding brand={mockBrandPublic} locale="es" />);
  });

  it("LoginScreenSkeleton", () => {
    render(<LoginScreenSkeleton />);
  });

  it("PwaServiceWorkerRegister", () => {
    render(<PwaServiceWorkerRegister />);
  });

  it("SignOutButton", () => {
    render(<SignOutButton locale="es" label="Out" />);
  });

  it("SignOutButton iconOnly", () => {
    render(<SignOutButton locale="es" label="Out" iconOnly />);
  });

  it("JsonLdOrganization", () => {
    render(<JsonLdOrganization locale="es" />);
  });

  it("LandingCefrIntroBanner", () => {
    render(
      <LandingCefrIntroBanner
        introLead={dictEn.landing.levels.introLead}
        introEmphasis={dictEn.landing.levels.introEmphasis}
        introTrail={dictEn.landing.levels.introTrail}
        scaleAria={dictEn.landing.levels.scaleAria}
      />,
    );
  });

  it("PwaPageShell web-mobile", () => {
    render(
      <PwaPageShell surface="web-mobile">
        <div>child</div>
      </PwaPageShell>,
    );
  });

  it("PwaPageShell pwa-mobile", () => {
    render(
      <PwaPageShell surface="pwa-mobile">
        <div>child</div>
      </PwaPageShell>,
    );
  });

  it("LandingHeaderPwa", () => {
    render(
      <LandingHeaderPwa
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail={null}
      />,
    );
  });

  it("LandingHeaderPwa shows administration link when isAdmin", () => {
    render(
      <LandingHeaderPwa
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail="admin@example.com"
        isAdmin
      />,
    );
    expect(screen.getByRole("link", { name: dictEn.nav.administration })).toHaveAttribute(
      "href",
      "/es/dashboard/admin",
    );
  });

  it("LandingFooterPwa", () => {
    render(
      <LandingFooterPwa
        dict={dictEn}
        brand={mockBrandPublic}
        locale="es"
        sessionEmail={null}
      />,
    );
  });

  it("LoginScreenNarrow web-mobile", () => {
    render(
      <LoginScreenNarrow
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        surface="web-mobile"
      />,
    );
  });

  it("LoginScreenNarrow pwa-mobile", () => {
    render(
      <LoginScreenNarrow
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        surface="pwa-mobile"
      />,
    );
  });

  it("AdminImportScreenNarrow", () => {
    render(
      <AdminImportScreenNarrow dict={dictEn} surface="web-mobile" />,
    );
  });
});

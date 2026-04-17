import { describe, it, beforeEach, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
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
import { AdminHubHome } from "@/components/dashboard/AdminHubHome";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";

const adminHubSummaryStub: AdminHubSummary = {
  traffic: { totalHits: 0, authenticatedHits: 0, guestHits: 0 },
  trafficWeekOverWeek: { thisWeek: 0, lastWeek: 0 },
  users: { total: 0, byRole: [] },
  payments: { pendingCount: 0 },
  registrations: { newCount: 0, totalCount: 0 },
  studentsWithoutSection: 0,
  messages: { recentCount: 0, latestPreview: null },
};
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
    render(<LandingCertifications dict={dictEn} />);
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

  it("LandingHeader shows panel link when session", () => {
    render(
      <LandingHeader
        brand={mockBrandPublic}
        dict={dictEn}
        locale="es"
        sessionEmail="teacher@example.com"
      />,
    );
    const panelLink = screen.getByRole("link", { name: dictEn.nav.administration });
    expect(panelLink).toHaveAttribute("href", "/es/dashboard");
  });

  it("AdminHubHome", () => {
    render(<AdminHubHome locale="es" dict={dictEn} summary={adminHubSummaryStub} />);
    expect(screen.getByText(dictEn.admin.home.title)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(dictEn.dashboard.adminNav.users) })).toHaveAttribute(
      "href",
      "/es/dashboard/admin/users",
    );
  });

  it("AdminHubHome shows students-without-section banner when count > 0", () => {
    render(
      <AdminHubHome
        locale="es"
        dict={dictEn}
        summary={{ ...adminHubSummaryStub, studentsWithoutSection: 2 }}
      />,
    );
    expect(
      screen.getByRole("link", {
        name: dictEn.admin.home.summary.studentsWithoutSection.linkAria.replace("{{count}}", "2"),
      }),
    ).toHaveAttribute("href", "/es/dashboard/admin/users");
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
      <AdminImportSurfaceGate locale="en" desktop={<div>d</div>} dict={dictEn} />,
    );
  });
});

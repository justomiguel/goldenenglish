import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { mockPathname, mockSearchParams } from "@/test/navigationMock";
import { dictEn } from "@/test/dictEn";
import type { AppSurface } from "@/hooks/useAppSurface";
import type { BrandPublic } from "@/lib/brand/server";
import { buildParentShellConfig } from "@/lib/portal/buildParentShellConfig";
import type { ParentFocusCatalog } from "@/lib/parent/parentFocusTypes";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";
import { installMemoryLocalStorage } from "@/__tests__/helpers/installMemoryLocalStorage";

const mockUseAppSurface = vi.fn<() => AppSurface>();

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => mockUseAppSurface(),
}));

import { PortalShell } from "@/components/portal/PortalShell";

const BASE = "/en/dashboard/parent";

const BRAND: BrandPublic = {
  name: "Golden English",
  logoPath: "/images/logo.png",
  logoAlt: "Golden English",
} as BrandPublic;

const ONE_CHILD: ParentFocusCatalog = {
  students: [{ studentId: "s1", displayName: "Mateo" }],
  sectionsByStudentId: { s1: [{ sectionId: "sec1", classLabel: "B1" }] },
};

const TWO_CHILDREN: ParentFocusCatalog = {
  students: [
    { studentId: "s1", displayName: "Mateo" },
    { studentId: "s2", displayName: "Ana" },
  ],
  sectionsByStudentId: {
    s1: [{ sectionId: "sec1", classLabel: "B1" }],
    s2: [{ sectionId: "sec2", classLabel: "A2" }],
  },
};

function config(focusCatalog: ParentFocusCatalog = ONE_CHILD) {
  return buildParentShellConfig({
    locale: "en",
    baseHref: BASE,
    dict: dictEn,
    includePayments: true,
    focusCatalog,
    activeStudentId: null,
    activeSectionId: null,
  });
}

function renderShell(focusCatalog?: ParentFocusCatalog) {
  return render(
    <PortalShell locale="en" brand={BRAND} dict={dictEn} config={config(focusCatalog)}>
      <p>Contenido</p>
    </PortalShell>,
  );
}

function anchor(name: string) {
  return document.querySelector(`[data-tour="${name}"]`);
}

describe("PortalShell", () => {
  beforeEach(() => {
    installMemoryLocalStorage().clear();
    mockPathname.mockReturnValue(BASE);
    mockSearchParams.mockReturnValue(new URLSearchParams());
    mockUseAppSurface.mockReturnValue("pwa-mobile");
  });

  it("renders the bottom tab bar and no top nav on mobile", () => {
    renderShell();
    expect(screen.getByRole("navigation", { name: dictEn.dashboard.portal.tabBarAria })).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: dictEn.dashboard.portal.topNavAria }),
    ).not.toBeInTheDocument();
  });

  it("renders the top nav and no bottom tab bar on desktop", () => {
    mockUseAppSurface.mockReturnValue("web-desktop");
    renderShell();
    expect(screen.getByRole("navigation", { name: dictEn.dashboard.portal.topNavAria })).toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: dictEn.dashboard.portal.tabBarAria }),
    ).not.toBeInTheDocument();
  });

  it("shows the children on both surfaces", () => {
    renderShell();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    mockUseAppSurface.mockReturnValue("web-desktop");
    renderShell();
    expect(screen.getAllByText("Contenido")).toHaveLength(2);
  });

  it("offers the account trigger instead of a settings tab", () => {
    renderShell();
    expect(
      screen.getByRole("button", { name: dictEn.dashboard.portal.accountOpen }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: dictEn.dashboard.parentNav.settings })).toBeNull();
  });

  it("hides the subject chips for one child in one section", () => {
    renderShell();
    expect(anchor(PARENT_TOUR_ANCHORS.portalSubjectChips)).toBeNull();
  });

  it("shows the subject chips when the tutor has more than one child", () => {
    renderShell(TWO_CHILDREN);
    expect(anchor(PARENT_TOUR_ANCHORS.portalSubjectChips)).not.toBeNull();
    expect(screen.getByRole("button", { name: "Ana" })).toBeInTheDocument();
  });

  it("keeps the header and tab bar tour anchors on mobile", () => {
    renderShell();
    expect(anchor(PARENT_TOUR_ANCHORS.chromeHeader)).not.toBeNull();
    expect(anchor(PARENT_TOUR_ANCHORS.tabBar)).not.toBeNull();
    expect(anchor(PARENT_TOUR_ANCHORS.portalAccount)).not.toBeNull();
  });

  it("exposes the top nav tour anchor on desktop", () => {
    mockUseAppSurface.mockReturnValue("web-desktop");
    renderShell();
    expect(anchor(PARENT_TOUR_ANCHORS.portalTopNav)).not.toBeNull();
    expect(anchor(PARENT_TOUR_ANCHORS.chromeHeader)).not.toBeNull();
  });
});

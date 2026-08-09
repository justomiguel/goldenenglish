// REGRESSION CHECK: L2 — mount parent chrome/content fixtures and assert tour anchors.
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ParentAccountScreen } from "@/components/parent/ParentAccountScreen";
import { ParentChildDetailLayout } from "@/components/parent/ParentChildDetailLayout";
import { PortalTabBar } from "@/components/portal/PortalTabBar";
import { PortalTopNav } from "@/components/portal/PortalTopNav";
import { buildParentShellConfig } from "@/lib/portal/buildParentShellConfig";
import { expectParentTourAnchorsInDocument } from "@/lib/parent-tutorials/expectParentTourAnchorsInDocument";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en/dashboard/parent",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

describe("parent tour anchor DOM presence (L2)", () => {
  it("renders account title and body anchors", () => {
    render(
      <ParentAccountScreen
        locale="en"
        title={dictEn.dashboard.parent.account.pageTitle}
        lead={dictEn.dashboard.parent.account.pageLead}
        items={[{ id: "language", label: "Language", action: "language" }]}
        localeLabels={dictEn.common.locale}
      />,
    );
    expectParentTourAnchorsInDocument([
      PARENT_TOUR_ANCHORS.accountTitle,
      PARENT_TOUR_ANCHORS.accountBody,
    ]);
  });

  it("renders the title anchor of a child section route", () => {
    render(
      <ParentChildDetailLayout
        locale="en"
        title="Attendance"
        backLabel="Back"
        studentId="s1"
        sectionId={null}
        tourAnchor={PARENT_TOUR_ANCHORS.attendanceTitle}
      >
        <div data-tour={PARENT_TOUR_ANCHORS.attendanceBody}>body</div>
      </ParentChildDetailLayout>,
    );
    expectParentTourAnchorsInDocument([
      PARENT_TOUR_ANCHORS.attendanceTitle,
      PARENT_TOUR_ANCHORS.attendanceBody,
    ]);
  });

  it("renders portal chrome anchors for the redesigned parent shell", () => {
    const config = buildParentShellConfig({
      locale: "en",
      baseHref: "/en/dashboard/parent",
      dict: dictEn,
      includePayments: true,
      focusCatalog: { students: [], sectionsByStudentId: {} },
      activeStudentId: null,
      activeSectionId: null,
    });
    render(
      <>
        <PortalTopNav
          destinations={config.destinations}
          ariaLabel={config.ariaTopNav}
          tourAnchor={config.tourAnchors.topNav}
        />
        <PortalTabBar
          destinations={config.destinations}
          ariaLabel={config.ariaTabBar}
          tourAnchor={config.tourAnchors.tabBar}
        />
      </>,
    );
    expectParentTourAnchorsInDocument([
      PARENT_TOUR_ANCHORS.portalTopNav,
      PARENT_TOUR_ANCHORS.tabBar,
    ]);
  });
});

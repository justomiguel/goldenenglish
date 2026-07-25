// REGRESSION CHECK: L2 — mount parent chrome/content fixtures and assert tour anchors.
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { ParentSidebar } from "@/components/dashboard/ParentSidebar";
import { ParentSettingsScreen } from "@/components/parent/ParentSettingsScreen";
import { ParentPwaTabBar } from "@/components/pwa/molecules/ParentPwaTabBar";
import { expectParentTourAnchorsInDocument } from "@/lib/parent-tutorials/expectParentTourAnchorsInDocument";
import { PARENT_TOUR_ANCHORS } from "@/lib/parent-tutorials/selectors";
import { dictEn } from "@/test/dictEn";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/en/dashboard/parent",
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
  it("renders desktop sidebar tour anchor", () => {
    render(
      <ParentSidebar
        locale="en"
        dict={dictEn.dashboard.parentNav}
        includePayments
      />,
    );
    expectParentTourAnchorsInDocument([PARENT_TOUR_ANCHORS.sidebar]);
  });

  it("renders settings title and body anchors", () => {
    render(
      <ParentSettingsScreen
        locale="en"
        labels={dictEn.dashboard.parent.settings}
        localeSwitcher={dictEn.common.locale}
      />,
    );
    expectParentTourAnchorsInDocument([
      PARENT_TOUR_ANCHORS.settingsTitle,
      PARENT_TOUR_ANCHORS.settingsBody,
    ]);
  });

  it("renders PWA tab bar tour anchor", () => {
    render(
      <ParentPwaTabBar
        locale="en"
        dict={dictEn.dashboard.parentNav}
        includePayments
      />,
    );
    expectParentTourAnchorsInDocument([PARENT_TOUR_ANCHORS.tabBar]);
  });
});

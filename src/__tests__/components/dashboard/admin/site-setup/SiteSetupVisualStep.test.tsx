import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteSetupVisualStep } from "@/components/dashboard/admin/site-setup/SiteSetupVisualStep";
import en from "@/dictionaries/en.json";
import type { SiteSetupOperationalValues } from "@/lib/site/loadSiteSetupCurrentValues";

const labels = en.dashboard.siteSetup.visual;
const issueCopy = en.dashboard.siteSetup.designTokenIssue;

function operational(patch: Partial<SiteSetupOperationalValues> = {}): SiteSetupOperationalValues {
  return {
    visualPrimary: "#103A5C",
    visualSecondary: "#C4A46B",
    visualAccent: "#C4A46B",
    visualBackground: "#FAF9F6",
    visualSurface: "#FFFFFF",
    fontHeading: "fraunces",
    fontBody: "dm-sans",
    layoutMaxWidth: "1280px",
    layoutBorderRadius: "0.75rem",
    academicsSectionMaxStudents: "20",
    academicsSectionMinAttendancePercent: "75",
    academicsTeacherPortalRoles: "teacher",
    attendanceTeacherScanLookbackBufferDays: "1",
    attendanceTeacherOperationalCivilLookbackDays: "1",
    attendanceTeacherOperationalMaxClassDays: "5",
    attendanceTeacherFullCourseMaxClassDays: "20",
    attendanceAdminFallbackLookbackDays: "1",
    attendanceAdminMaxClassDays: "20",
    attendancePickAdjacentCivilDays: "1",
    attendanceHasEligibleWindowMaxScans: "3",
    legalAgeMajority: "18",
    studentRenewalWarnDays: "30",
    billingTermEnrollment: "Matrícula",
    billingTermEnrollmentEn: "Enrollment",
    billingTermMonthly: "Mensualidad",
    billingTermMonthlyEn: "Monthly",
    billingTermPromotion: "Promoción",
    billingTermPromotionEn: "Promotion",
    billingCurrency: "USD",
    analyticsEventNamespace: "ge",
    analyticsEventVersion: "1",
    analyticsTimezone: "America/Argentina/Buenos_Aires",
    ...patch,
  };
}

describe("SiteSetupVisualStep", () => {
  it("shows heading and body selects and hides the mono field", () => {
    render(
      <SiteSetupVisualStep
        labels={labels}
        operational={operational()}
        tenantSlug="golden"
        update={() => undefined}
      />,
    );
    expect(screen.getByLabelText(labels.fontHeading).tagName).toBe("SELECT");
    expect(screen.getByLabelText(labels.fontBody).tagName).toBe("SELECT");
    expect(screen.queryByLabelText("Monospace font")).toBeNull();
  });

  it("shows an owned font only for the owner", () => {
    const { unmount } = render(
      <SiteSetupVisualStep
        labels={labels}
        operational={operational()}
        tenantSlug="golden"
        update={() => undefined}
      />,
    );
    expect(screen.queryByRole("option", { name: "Fast Blaze" })).toBeNull();
    unmount();
    render(
      <SiteSetupVisualStep
        labels={labels}
        operational={operational()}
        tenantSlug="espaciozenit"
        update={() => undefined}
      />,
    );
    expect(screen.getAllByRole("option", { name: "Fast Blaze" })).toHaveLength(2);
  });

  it("shows the contrast sentence and the stable code", () => {
    render(
      <SiteSetupVisualStep
        labels={labels}
        operational={operational()}
        tenantSlug="golden"
        issue={{ code: "contrast_below_aa", token: "color.primary" }}
        issueCopy={issueCopy}
        update={() => undefined}
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("hard to read");
    expect(alert.textContent).toContain("Code: contrast_below_aa");
  });

  it("shows an unknown code in the alert", () => {
    render(
      <SiteSetupVisualStep
        labels={labels}
        operational={operational()}
        tenantSlug={null}
        issue={{ code: "wizard_exploded", token: "color.primary" }}
        issueCopy={issueCopy}
        update={() => undefined}
      />,
    );
    expect(screen.getByRole("alert").textContent).toContain("wizard_exploded");
  });
});

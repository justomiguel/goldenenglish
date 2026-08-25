import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminHubHome } from "@/components/dashboard/AdminHubHome";
import { dictEn } from "@/test/dictEn";
import type { AdminHubSummary } from "@/lib/dashboard/loadAdminHubSummary";
import { evaluateAdminFirstClassChecklist } from "@/lib/dashboard/evaluateAdminFirstClassChecklist";

const SUMMARY: AdminHubSummary = {
  traffic: { totalHits: 0, authenticatedHits: 0, guestHits: 0 },
  trafficWeekOverWeek: { thisWeek: 0, lastWeek: 0 },
  users: { total: 0, byRole: [] },
  payments: { pendingCount: 0 },
  registrations: { newCount: 0, totalCount: 0 },
  studentsWithoutSection: 0,
  messages: { recentCount: 0, latestPreview: null },
};

const INCOMPLETE = evaluateAdminFirstClassChecklist(
  {
    hasStudent: false,
    hasTeacher: false,
    hasCohort: false,
    hasSection: false,
    hasTeacherAssignedToSection: false,
    hasStudentEnrolledInSection: false,
    hasSectionSchedule: false,
    hasSectionFees: false,
    hasPaymentMethod: false,
  },
  "en",
);

const COMPLETE = evaluateAdminFirstClassChecklist(
  {
    hasStudent: true,
    hasTeacher: true,
    hasCohort: true,
    hasSection: true,
    hasTeacherAssignedToSection: true,
    hasStudentEnrolledInSection: true,
    hasSectionSchedule: true,
    hasSectionFees: true,
    hasPaymentMethod: true,
  },
  "en",
);

function renderHub(
  checklist?: ReturnType<typeof evaluateAdminFirstClassChecklist>,
) {
  return render(
    <AdminHubHome
      locale="en"
      dict={dictEn}
      summary={SUMMARY}
      birthdayRows={[]}
      birthdaysDict={dictEn.dashboard.birthdays}
      checklist={checklist}
    />,
  );
}

describe("AdminHubHome first-class checklist", () => {
  it("hides the card when the checklist is omitted or already complete", () => {
    const { rerender } = renderHub();
    expect(
      screen.queryByRole("heading", { name: dictEn.admin.home.firstClassChecklist.title }),
    ).not.toBeInTheDocument();

    rerender(
      <AdminHubHome
        locale="en"
        dict={dictEn}
        summary={SUMMARY}
        birthdayRows={[]}
        birthdaysDict={dictEn.dashboard.birthdays}
        checklist={COMPLETE}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: dictEn.admin.home.firstClassChecklist.title }),
    ).not.toBeInTheDocument();
  });

  it("shows the card above the metric grid when work remains", () => {
    const { container } = renderHub(INCOMPLETE);
    const title = screen.getByRole("heading", {
      name: dictEn.admin.home.firstClassChecklist.title,
    });
    const traffic = container.querySelector('[data-tour="admin-hub-traffic"]');
    expect(title).toBeInTheDocument();
    expect(traffic).toBeTruthy();
    if (!traffic) return;
    const relation = title.compareDocumentPosition(traffic);
    expect(Boolean(relation & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
  });
});

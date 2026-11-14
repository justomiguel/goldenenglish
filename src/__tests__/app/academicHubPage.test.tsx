import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AcademicHubPage from "@/app/[locale]/dashboard/admin/academic/page";
import { getDictionary } from "@/lib/i18n/dictionaries";

const rows = vi.hoisted(() => ({
  data: [] as Array<{
    id: string;
    name: string;
    is_current: boolean;
    archived_at: string | null;
  }>,
}));

vi.mock("@/lib/brand/server", () => ({
  getBrandForRequest: async () => ({ name: "Institute" }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
    from: () => {
      let cohortId = "";
      const chain = {
        select: () => chain,
        order: async () => ({ data: rows.data }),
        eq: (_column: string, value: string) => {
          cohortId = value;
          return chain;
        },
        is: async () => ({ data: [] }),
        maybeSingle: async () => {
          const row = rows.data.find((item) => item.id === cohortId) ?? null;
          return {
            data: row
              ? {
                  ...row,
                  default_enrollment_fee_amount: null,
                  default_monthly_fee: null,
                  enrollment_fee_mode: "per_section",
                  offers_trial: false,
                  trial_fee_amount: null,
                }
              : null,
            error: null,
          };
        },
      };
      return chain;
    },
  }),
}));

vi.mock("@/lib/academics/loadAdminCohortPageData", () => ({
  loadAdminCohortPageData: async (_client: unknown, cohortId: string) => ({
    sectionRows: [
      {
        id: "sec-1",
        name: cohortId === "old" ? "Old section" : "Monday group",
        active: 1,
        max: 12,
        archivedAt: null,
        referenceImageUrl: null,
        teacherNames: ["Vargas Ana"],
        scheduleLine: "Mon 18:00–19:30",
      },
    ],
    distinctActiveStudents: 1,
    targetOptions: [],
    sourceSectionOptions: [],
    teachers: [],
    copySourceOptions: [],
    defaultSectionMaxStudents: 12,
  }),
}));

describe("AcademicHubPage", () => {
  it("opens the current cohort on the sections tab", async () => {
    rows.data = [
      { id: "old", name: "2024", is_current: false, archived_at: "2025-01-01" },
      { id: "current", name: "2026", is_current: true, archived_at: null },
    ];
    const dict = await getDictionary("en");
    const ui = await AcademicHubPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(screen.getByRole("heading", { name: dict.dashboard.academicHub.title })).toBeInTheDocument();
    expect(screen.getByLabelText("Year/Cohort")).toHaveValue("current");
    expect(screen.getByRole("option", { name: "2026 · Current" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "2024 · Archived" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Monday group")).toBeInTheDocument();
    expect(screen.getByText("Vargas Ana")).toBeInTheDocument();
    expect(screen.getByText("Mon 18:00–19:30")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open this year" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: dict.dashboard.academicCohortPage.shellTabs.sections }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("uses the cohort query and shows that cohort's sections", async () => {
    rows.data = [
      { id: "old", name: "2024", is_current: false, archived_at: "2025-01-01" },
      { id: "current", name: "2026", is_current: true, archived_at: null },
    ];
    const ui = await AcademicHubPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({ cohort: "old" }),
    });
    render(ui);

    expect(screen.getByLabelText("Year/Cohort")).toHaveValue("old");
    expect(screen.getByText("Old section")).toBeInTheDocument();
    expect(screen.queryByText("Monday group")).not.toBeInTheDocument();
  });

  it("asks for a year when none is current", async () => {
    rows.data = [{ id: "active", name: "2027", is_current: false, archived_at: null }];
    const dict = await getDictionary("en");
    const ui = await AcademicHubPage({
      params: Promise.resolve({ locale: "en" }),
      searchParams: Promise.resolve({}),
    });
    render(ui);

    expect(screen.getByRole("status")).toHaveTextContent(dict.dashboard.academicHub.emptyPickCohort);
    expect(screen.queryByText("Monday group")).not.toBeInTheDocument();
  });
});

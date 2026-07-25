// REGRESSION CHECK: Catalog ids and data-tour selectors are the public contract for
// admin tutorials; renaming break Driver.js steps and Help list wiring.
import { describe, expect, it } from "vitest";
import {
  ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT,
  adminTourSelector,
  ADMIN_TOUR_ANCHORS,
} from "@/lib/admin-tutorials/selectors";
import { listAdminTutorials } from "@/lib/admin-tutorials/catalog";
import {
  academicHubPath,
  isAcademicHubPath,
  isAcademicCohortDetailPath,
} from "@/lib/admin-tutorials/academicHubPath";
import { createUserPath, isCreateUserPath } from "@/lib/admin-tutorials/createUserPath";

describe("admin-tutorials selectors", () => {
  it("builds stable data-tour CSS selectors", () => {
    expect(adminTourSelector(ADMIN_TOUR_ANCHORS.newCohort)).toBe(
      '[data-tour="academic-new-cohort"]',
    );
    expect(ADMIN_TUTORIAL_OPEN_NEW_COHORT_EVENT).toBe("ge:admin-tutorial:open-new-cohort");
  });
});

describe("admin-tutorials catalog", () => {
  it("includes catalog tutorials with list icons and groups", () => {
    const rows = listAdminTutorials();
    expect(rows.map((t) => t.id)).toEqual([
      "create-cohort",
      "create-section",
      "take-attendance",
      "approve-payment",
      "reject-payment",
      "assign-scholarship-percent",
      "assign-scholarship-full",
      "enable-mercadopago",
      "enable-flow",
      "change-billing-currency",
      "approve-event-payment",
      "assign-section-scholarship-bulk",
      "change-site-setup-currency",
      "create-student",
      "create-teacher",
      "create-admin",
      "reset-user-password",
      "import-users",
      "create-event",
      "create-blog-article",
      "create-blog-article-as-teacher",
    ]);
    expect(rows[0]?.icon).toBe("layers");
    expect(rows[0]?.group).toBe("academic");
    expect(rows.find((r) => r.id === "create-event")?.group).toBe("content");
    expect(rows.find((r) => r.id === "enable-mercadopago")?.group).toBe("billing");
  });
});

describe("admin-tutorials createUserPath", () => {
  it("matches create-user routes", () => {
    expect(createUserPath("en")).toBe("/en/dashboard/admin/users/new");
    expect(isCreateUserPath("/en/dashboard/admin/users/new", "en")).toBe(true);
  });
});

describe("admin-tutorials academicHubPath", () => {
  it("matches academic hub and cohort detail routes", () => {
    expect(academicHubPath("es")).toBe("/es/dashboard/admin/academic");
    expect(isAcademicHubPath("/es/dashboard/admin/academic", "es")).toBe(true);
    expect(isAcademicHubPath("/es/dashboard/admin/academic/", "es")).toBe(true);
    expect(isAcademicHubPath("/es/dashboard/admin/academic/contents", "es")).toBe(false);
    expect(
      isAcademicCohortDetailPath(
        "/es/dashboard/admin/academic/11111111-1111-4111-8111-111111111111",
        "es",
      ),
    ).toBe(true);
  });
});

import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { adminTourSelector, ADMIN_TOUR_ANCHORS } from "../src/lib/admin-tutorials/selectors";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

/** Surname-first label for seeded e2e-student-b (EnrolleeB / E2E). */
const STUDENT_B_LABEL = /EnrolleeB\s+E2E/i;

test.describe("@critical-section-enroll", () => {
  test.use({ storageState: paths.storageState });

  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin can enroll seeded student-b into the e2e section", async ({ page }) => {
    test.setTimeout(90_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const cohortId = process.env.E2E_COHORT_ID?.trim();
    const sectionId = process.env.E2E_SECTION_ID?.trim();
    test.skip(!cohortId || !sectionId, "E2E_COHORT_ID / E2E_SECTION_ID missing — re-run e2e:stack:up");

    await page.goto(
      `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}?tab=students`,
    );
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.sectionDetail))).toBeVisible({
      timeout: 20_000,
    });

    const rosterRow = page.locator("table tbody tr").filter({ hasText: STUDENT_B_LABEL });
    if (await rosterRow.count()) {
      await expect(rosterRow.first()).toContainText(/active/i);
      return;
    }

    const search = page.locator("#academic-section-enroll-student");
    await expect(search).toBeVisible({ timeout: 15_000 });
    await search.click();
    await search.fill("");
    await search.fill("EnrolleeB");

    // Combobox debounces ~280ms then calls searchAdminStudentsAction.
    const pick = page.getByRole("button", { name: STUDENT_B_LABEL }).first();
    await expect(pick).toBeVisible({ timeout: 30_000 });
    await pick.click();

    await page.getByRole("button", { name: /^Inscribir$|^Enroll$/i }).click();

    // Success toast can clear on router.refresh(); roster is the durable signal.
    const enrolled = page.locator("table tbody tr").filter({ hasText: STUDENT_B_LABEL });
    await expect(enrolled).toBeVisible({ timeout: 45_000 });
    await expect(enrolled).toContainText(/active/i);
  });
});

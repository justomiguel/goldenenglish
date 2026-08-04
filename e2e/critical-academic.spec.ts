import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { adminTourSelector } from "../src/lib/admin-tutorials/selectors";
import { ADMIN_TOUR_ANCHORS } from "../src/lib/admin-tutorials/selectors";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

test.describe("@critical-academic", () => {
  test.use({ storageState: paths.storageState });

  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("academic hub shows cohort board and new-cohort control", async ({ page }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    await gotoIsolated(page, `/${locale}/dashboard/admin/academic`);
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.academicTitle))).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.academicBoardTabs))).toBeVisible();
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.newCohort))).toBeVisible();
    await expect(page.getByText(/E2E Cohort/i).first()).toBeVisible();
  });

  test("seeded cohort sections page exposes new-section control", async ({ page }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const cohortId = process.env.E2E_COHORT_ID?.trim();
    test.skip(!cohortId, "E2E_COHORT_ID missing — re-run e2e:stack:up");
    await gotoIsolated(page, `/${locale}/dashboard/admin/academic/${cohortId}`);
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.cohortDetail))).toBeVisible({
      timeout: 20_000,
    });
    // Sections tab may need a click depending on default tab.
    const sectionsTab = page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.cohortSectionsTab));
    if (await sectionsTab.count()) {
      await sectionsTab.first().click();
    }
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.newSection))).toBeVisible({
      timeout: 15_000,
    });
  });
});

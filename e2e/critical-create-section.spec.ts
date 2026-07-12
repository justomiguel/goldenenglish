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

test.describe("@critical-create-section", () => {
  test.use({ storageState: paths.storageState });

  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin can create a section on the seeded cohort", async ({ page }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const cohortId = process.env.E2E_COHORT_ID?.trim();
    test.skip(!cohortId, "E2E_COHORT_ID missing — re-run e2e:stack:up");

    const suffix = Date.now().toString(36);
    const sectionName = `E2E Sec ${suffix}`;

    await page.goto(`/${locale}/dashboard/admin/academic/${cohortId}`);
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.cohortDetail))).toBeVisible({
      timeout: 20_000,
    });

    const sectionsTab = page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.cohortSectionsTab));
    if (await sectionsTab.count()) {
      await sectionsTab.first().click();
    }

    await page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.newSection)).click();
    await expect(page.locator("#ns-name")).toBeVisible({ timeout: 10_000 });

    await page.locator("#ns-name").fill(sectionName);

    const teacherSelect = page.locator("#ns-teacher");
    const teacherOptions = teacherSelect.locator("option");
    const optionCount = await teacherOptions.count();
    let teacherValue = "";
    for (let i = 0; i < optionCount; i++) {
      const text = (await teacherOptions.nth(i).textContent()) ?? "";
      const value = await teacherOptions.nth(i).getAttribute("value");
      if (value && /teacher|e2e/i.test(text)) {
        teacherValue = value;
        break;
      }
    }
    if (!teacherValue) {
      // Fallback: first non-empty option
      for (let i = 0; i < optionCount; i++) {
        const value = await teacherOptions.nth(i).getAttribute("value");
        if (value) {
          teacherValue = value;
          break;
        }
      }
    }
    expect(teacherValue, "seeded teacher should appear in #ns-teacher").toBeTruthy();
    await teacherSelect.selectOption(teacherValue);

    await page.locator("#section-schedule-day-0").selectOption("1"); // Monday
    await page.locator("#section-schedule-start-0").fill("08:00");
    await page.locator("#section-schedule-end-0").fill("09:00");

    await page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.newSectionSubmit)).click();

    await expect(page).toHaveURL(
      new RegExp(`/dashboard/admin/academic/${cohortId}/[0-9a-f-]{36}`, "i"),
      { timeout: 60_000 },
    );
    // Section RSC is heavy on cold compile; wait for the tour anchor (do not force a second full navigation).
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.sectionDetail))).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(sectionName).first()).toBeVisible({ timeout: 20_000 });
  });
});

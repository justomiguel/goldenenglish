import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { adminTourSelector, ADMIN_TOUR_ANCHORS } from "../src/lib/admin-tutorials/selectors";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  e2eSharedPassword,
  resolveE2eIsolation,
} from "./env";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

function tourInput(anchor: string) {
  return `${adminTourSelector(anchor)} input, ${adminTourSelector(anchor)} select`;
}

test.describe("@critical-create-user", () => {
  test.use({ storageState: paths.storageState });

  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin can create a teacher user", async ({ page }) => {
    test.setTimeout(90_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const email = `e2e-new-teacher-${suffix}@example.test`;
    const password = e2eSharedPassword();

    await page.goto(`/${locale}/dashboard/admin/users/new`);
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.createUserForm))).toBeVisible({
      timeout: 20_000,
    });

    await page.locator(tourInput(ADMIN_TOUR_ANCHORS.createUserRole)).selectOption("teacher");
    await page.locator(tourInput(ADMIN_TOUR_ANCHORS.createUserLastName)).fill(`Teach${suffix}`);
    await page.locator(tourInput(ADMIN_TOUR_ANCHORS.createUserFirstName)).fill("E2E");
    await page.locator(tourInput(ADMIN_TOUR_ANCHORS.createUserDni)).fill(`E2ET${suffix}`.slice(0, 12));
    await page.locator(tourInput(ADMIN_TOUR_ANCHORS.createUserEmail)).fill(email);
    await page.locator(tourInput(ADMIN_TOUR_ANCHORS.createUserPassword)).fill(password);
    await page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.createUserSubmit)).click();

    await expect(
      page.getByText(new RegExp(email.replace(".", "\\."), "i")).or(
        page.getByText(/creado|created|éxito|success/i),
      ).first(),
    ).toBeVisible({ timeout: 60_000 });
  });
});

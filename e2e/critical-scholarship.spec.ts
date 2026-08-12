import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { adminTourSelector, ADMIN_TOUR_ANCHORS } from "../src/lib/admin-tutorials/selectors";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";
import {
  e2eScholarshipMonth,
  monthShortLabel,
} from "./helpers/e2eSeedDueMonths";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

/**
 * Assigns a 25% scholarship on a non-record month so it does not collide with
 * critical-record-payment (v_record_month). Uses AdminRecordPaymentPanel action
 * recordPaymentActionAddScholarship, with scholarship-tab fallback from
 * task:assign-scholarship-percent.
 */
test.describe("@critical-scholarship", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin assigns 25% scholarship on a non-record month", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const studentId = process.env.E2E_STUDENT_ID?.trim();
    const sectionId = process.env.E2E_SECTION_ID?.trim();
    test.skip(
      !studentId || !sectionId,
      "E2E_STUDENT_ID / E2E_SECTION_ID missing — re-run e2e:stack:up",
    );

    const scholarshipMonth = e2eScholarshipMonth();
    const monthLabel = monthShortLabel(locale, scholarshipMonth);
    const monthRe = monthLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    await gotoIsolated(
      page,
      `/${locale}/dashboard/admin/users/${studentId}/billing`,
    );
    await expect(page.getByRole("heading").first()).toBeVisible({
      timeout: 20_000,
    });

    // Prefer the planned scholarship month when it is still open with no prior
    // scholarship. Fall back to any plain Vencido cell (name ends with Vencido —
    // skip months that already show "75% beca" / "100% beca" etc.).
    const plannedCell = page.getByRole("button", {
      name: new RegExp(`^${monthRe}\\s*·\\s*Vencido$`, "i"),
    });
    const openCell = page.getByRole("button", { name: /·\s*Vencido$/i });
    const billingCell =
      (await plannedCell.count()) > 0 ? plannedCell.first() : openCell.first();

    if ((await billingCell.count()) > 0) {
      const cellName = (await billingCell.getAttribute("aria-label")) ?? (await billingCell.innerText());
      await billingCell.click();
      await page
        .getByRole("button", {
          name: /Aplicar beca|Apply scholarship|Add scholarship/i,
        })
        .click();

      const percentInput = page.locator("#record-payment-scholarship-pct");
      await expect(percentInput).toBeVisible({ timeout: 10_000 });
      await percentInput.fill("");
      await percentInput.fill("25");
      await expect(percentInput).toHaveValue("25");

      await page.getByRole("button", { name: /Confirmar|Confirm/i }).click();
      // Stash for clearer failure messages if the badge assert fails later.
      test.info().annotations.push({ type: "scholarship-cell", description: cellName });
    } else {
      // Fallback: scholarship tab (task:assign-scholarship-percent anchors).
      await page
        .locator(adminTourSelector(ADMIN_TOUR_ANCHORS.scholarshipTab))
        .click();
      await expect(
        page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.scholarshipPanel)),
      ).toBeVisible({ timeout: 15_000 });

      const percentInput = page.locator("#sch-pct");
      await expect(percentInput).toBeVisible({ timeout: 10_000 });
      await percentInput.fill("25");
      await expect(percentInput).toHaveValue("25");

      await page
        .locator(adminTourSelector(ADMIN_TOUR_ANCHORS.scholarshipSave))
        .click();
    }

    await expect(async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      const badge = page
        .getByRole("button", { name: /25\s*%/ })
        .or(page.getByText(/\b25\s*%/))
        .first();
      await expect(badge).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 45_000 });
  });
});

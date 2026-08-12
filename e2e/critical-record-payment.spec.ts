import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";
import { e2eSeedDueMonths, monthShortLabel } from "./helpers/e2eSeedDueMonths";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

/**
 * Marks the fourth seeded due month (`v_record_month`) paid without a receipt
 * via AdminRecordPaymentPanel on student billing (labels recordPaymentActionMarkPaid).
 */
test.describe("@critical-record-payment", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin records payment without receipt for v_record_month", async ({
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

    const { record } = e2eSeedDueMonths();
    const monthLabel = monthShortLabel(locale, record);
    // Escape for RegExp (Intl may include diacritics / punctuation).
    const monthRe = monthLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    await gotoIsolated(
      page,
      `/${locale}/dashboard/admin/users/${studentId}/billing`,
    );
    await expect(page.getByRole("heading").first()).toBeVisible({
      timeout: 20_000,
    });

    // Prefer billing matrix (exact recordPayment* labels). Fallback: section collections.
    const billingCell = page.getByRole("button", {
      name: new RegExp(`^${monthRe}\\s*·`, "i"),
    });
    const collectionsPath = `/${locale}/dashboard/admin/finance/collections/${sectionId}`;
    let cell = billingCell.first();
    if ((await billingCell.count()) === 0) {
      await gotoIsolated(page, collectionsPath);
      await expect(page.getByRole("heading").first()).toBeVisible({
        timeout: 20_000,
      });
      cell = page
        .getByRole("button", {
          name: new RegExp(`Student\\s+E2E.*${monthRe}`, "i"),
        })
        .first();
    }

    await expect(cell).toBeVisible({ timeout: 20_000 });
    await cell.click();

    await page
      .getByRole("button", {
        name: /Registrar como pagado|Marcar pagado|Record as paid|Mark paid/i,
      })
      .click();

    await page
      .getByRole("button", { name: /Confirmar|Confirm/i })
      .click();

    await expect(async () => {
      await page.reload({ waitUntil: "domcontentloaded" });
      const paidCell = page
        .getByRole("button", {
          name: new RegExp(
            `${monthRe}.*(?:Pagado|Cobrado|Paid|Approved)`,
            "i",
          ),
        })
        .or(
          page.getByRole("button", {
            name: new RegExp(
              `Student\\s+E2E.*${monthRe}.*(?:Pagado|Cobrado|Paid|Approved)`,
              "i",
            ),
          }),
        )
        .first();
      await expect(paidCell).toBeVisible({ timeout: 10_000 });
    }).toPass({ timeout: 45_000 });
  });
});

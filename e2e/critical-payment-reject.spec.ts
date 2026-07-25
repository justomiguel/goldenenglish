import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { clickFirstPendingMonthlyDue } from "./helpers/clickFirstPendingMonthlyDue";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);
const receiptFixture = path.join(__dirname, "fixtures", "receipt-tiny.png");

/**
 * Relies on seed third due month + project order after student/parent approve specs
 * so the first remaining pending due is the reject fixture.
 */
test.describe("@critical-payment-reject", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
    test.skip(!existsSync(receiptFixture), "Missing e2e/fixtures/receipt-tiny.png");
  });

  test("student uploads receipt → admin rejects → student sees rejected", async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";

    const studentCtx = await browser.newContext({
      storageState: paths.studentStorageState,
    });
    const studentPage = await studentCtx.newPage();
    await studentPage.goto(`/${locale}/dashboard/student/payments`);
    await expect(studentPage.getByRole("heading").first()).toBeVisible({
      timeout: 20_000,
    });

    await clickFirstPendingMonthlyDue(studentPage);

    await studentPage.locator('input[name="receipt"]').setInputFiles(receiptFixture);
    await studentPage
      .getByRole("button", { name: /Enviar comprobante|Send receipt/i })
      .click();
    await expect(
      studentPage.getByText(/Comprobante recibido|Receipt uploaded/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    await studentCtx.close();

    const adminCtx = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await adminCtx.newPage();
    await adminPage.goto(`/${locale}/dashboard/admin/finance?tab=inbox`);
    const row = adminPage.locator("li").filter({ hasText: /Student\s+E2E/i }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    // Dict label is "Rechazado" / "Rejected" (admin.payments.reject).
    await row.getByRole("button", { name: /Rechazado|Rejected/i }).click();
    await expect(row).toBeHidden({ timeout: 20_000 });
    await adminCtx.close();

    const verifyCtx = await browser.newContext({
      storageState: paths.studentStorageState,
    });
    const verifyPage = await verifyCtx.newPage();
    await verifyPage.goto(`/${locale}/dashboard/student/payments`);
    await expect(
      verifyPage.getByRole("button", { name: /Rechazado|Rejected/i }).first(),
    ).toBeVisible({ timeout: 30_000 });
    await verifyCtx.close();
  });
});

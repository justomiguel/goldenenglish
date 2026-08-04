import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";
import { clickFirstPendingMonthlyDue } from "./helpers/clickFirstPendingMonthlyDue";
import { reviewFinanceInboxMonthlyReceipt } from "./helpers/reviewFinanceInboxMonthlyReceipt";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);
const receiptFixture = path.join(__dirname, "fixtures", "receipt-tiny.png");

test.describe("@critical-payments", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
    test.skip(!existsSync(receiptFixture), "Missing e2e/fixtures/receipt-tiny.png");
  });

  test("student uploads receipt → admin approves → student sees paid", async ({
    browser,
  }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";

    const studentCtx = await browser.newContext({
      storageState: paths.studentStorageState,
    });
    const studentPage = await studentCtx.newPage();
    await gotoIsolated(studentPage, `/${locale}/dashboard/student/payments`);
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
    await gotoIsolated(adminPage, `/${locale}/dashboard/admin/finance?tab=inbox`);
    await reviewFinanceInboxMonthlyReceipt(adminPage, "approve");
    await adminCtx.close();

    const verifyCtx = await browser.newContext({
      storageState: paths.studentStorageState,
    });
    const verifyPage = await verifyCtx.newPage();
    await gotoIsolated(verifyPage, `/${locale}/dashboard/student/payments`);
    await expect(
      verifyPage
        .getByRole("button", { name: /Pagado|Paid|Cobrado|Approved/i })
        .or(verifyPage.getByText(/ya está saldado|already settled/i))
        .first(),
    ).toBeVisible({ timeout: 30_000 });
    await verifyCtx.close();
  });
});

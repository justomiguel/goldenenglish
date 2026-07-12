import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);
const receiptFixture = path.join(__dirname, "fixtures", "receipt-tiny.png");

test.describe("@critical-event-payment-approve", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
    test.skip(!existsSync(receiptFixture), "Missing e2e/fixtures/receipt-tiny.png");
  });

  test("paid event register → admin approves pending payment", async ({ browser }) => {
    test.setTimeout(150_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const email = `e2e-paid-appr-${suffix}@example.test`;

    const anon = await browser.newContext();
    const page = await anon.newPage();
    await page.goto(`/${locale}/events/e2e-paid-event/register`);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /404/i })).toHaveCount(0);

    await page.getByRole("textbox", { name: /Nombre|First name/i }).fill("E2E");
    await page.getByRole("textbox", { name: /Apellido|Last name/i }).fill(`Appr${suffix}`);
    await page
      .getByRole("textbox", { name: /Documento|ID \/ RUT|DNI/i })
      .fill(`E2EAPR${suffix}`.slice(0, 12));
    await page.getByRole("textbox", { name: /Email|Correo/i }).fill(email);

    await expect(
      page.getByText(/Transferencia bancaria|Bank transfer/i).first(),
    ).toBeVisible({ timeout: 15_000 });
    const transferRadio = page.locator('input[name="event-payment-method"][value="transfer"]');
    if (await transferRadio.count()) {
      await transferRadio.check();
    }
    await page
      .getByLabel(/Seleccionar comprobante de transferencia|Select bank transfer proof/i)
      .setInputFiles(receiptFixture);
    await page.getByRole("checkbox", { name: /Acepto|I accept/i }).check();
    await page
      .getByRole("button", { name: /Enviar inscripción|Submit registration/i })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    await expect(
      dialog.getByRole("heading", { name: /¡Gracias!|Thank you!/i }),
    ).toBeVisible();
    await anon.close();

    const adminCtx = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await adminCtx.newPage();
    await adminPage.goto(`/${locale}/dashboard/admin/events?q=e2e-paid-event`);
    const manage = adminPage.getByRole("link", { name: /Gestionar|Manage/i }).first();
    await expect(manage).toBeVisible({ timeout: 20_000 });
    await manage.click();

    await expect(adminPage).toHaveURL(/\/dashboard\/admin\/events\/[0-9a-f-]{36}/i, {
      timeout: 20_000,
    });
    const eventUrl = adminPage.url().split("?")[0];
    await adminPage.goto(
      `${eventUrl}?tab=payments&paymentStatus=pending&paymentsQ=${encodeURIComponent(email)}`,
    );

    const row = adminPage.locator("li").filter({ hasText: email }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.getByRole("button", { name: /OK — Pagado|OK — Paid/i }).click();
    await expect(row).toBeHidden({ timeout: 20_000 });
    await adminCtx.close();
  });
});

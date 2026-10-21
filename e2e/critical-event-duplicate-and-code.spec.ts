import { test, expect, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);
const receiptFixture = path.join(__dirname, "fixtures", "receipt-tiny.png");

test.describe("@critical-event-duplicate-and-code", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
    test.skip(!existsSync(receiptFixture), "Missing e2e/fixtures/receipt-tiny.png");
  });

  test("admin duplicates the published paid event into a draft", async ({ browser }) => {
    test.setTimeout(90_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const adminCtx = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await adminCtx.newPage();
    const eventPath = await openPaidEvent(adminPage, locale);
    const sourceId = eventPath.split("/").pop();

    await adminPage.getByRole("button", { name: /Duplicar evento|Duplicate event/i }).click();
    await expect(adminPage).toHaveURL(/\/dashboard\/admin\/events\/[0-9a-f-]{36}/i, { timeout: 30_000 });
    const nextId = new URL(adminPage.url()).pathname.split("/").pop();
    expect(nextId).not.toBe(sourceId);
    await expect(adminPage.getByRole("heading", { name: /\(copia\)|\(copy\)/i })).toBeVisible({
      timeout: 20_000,
    });
    await expect(
      adminPage.getByText(/está en borrador|is a draft/i),
    ).toBeVisible();
    await adminCtx.close();
  });

  test("discount code stays reserved until the admin approves payment", async ({ browser }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const code = `E2E${suffix}`.slice(0, 32);
    const email = `e2e-code-${suffix}@example.test`;

    const adminCtx = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await adminCtx.newPage();
    const eventPath = await openPaidEvent(adminPage, locale);
    await gotoIsolated(adminPage, `${eventPath}?tab=codes`);
    await adminPage.getByRole("textbox", { name: /^Código$|^Code$/i }).fill(code);
    await adminPage.getByRole("textbox", { name: /^Usos$|^Uses$/i }).fill("1");
    await adminPage.getByRole("textbox", { name: /^Porcentaje$|^Percent$/i }).fill("10");
    await adminPage.getByRole("button", { name: /Agregar código|Add code/i }).click();
    await expect(adminPage.getByText(/Códigos guardados|Codes saved/i)).toBeVisible({ timeout: 20_000 });
    await expect(adminPage.getByRole("cell", { name: code })).toBeVisible({ timeout: 20_000 });

    const anon = await browser.newContext();
    const page = await anon.newPage();
    await gotoIsolated(page, `/${locale}/events/e2e-paid-event/register`);
    await page.getByLabel(/Código de descuento|Discount code/i).fill(code);
    await page.getByRole("button", { name: /^Aplicar$|^Apply$/i }).click();
    await expect(page.getByText(/Con este código pagas|With this code you pay/i)).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("textbox", { name: /Nombre|First name/i }).fill("E2E");
    await page.getByRole("textbox", { name: /Apellido|Last name/i }).fill(`Code${suffix}`);
    await page
      .getByRole("textbox", { name: /Documento|ID \/ RUT|DNI/i })
      .fill(`E2ECOD${suffix}`.slice(0, 12));
    await page.getByRole("textbox", { name: /Email|Correo/i }).fill(email);
    const transferRadio = page.locator('input[name="event-payment-method"][value="transfer"]');
    if (await transferRadio.count()) await transferRadio.check();
    await page
      .getByLabel(/Seleccionar comprobante de transferencia|Select bank transfer proof/i)
      .setInputFiles(receiptFixture);
    await page.getByRole("checkbox", { name: /Acepto|I accept/i }).check();
    await page.getByRole("button", { name: /Enviar inscripción|Submit registration/i }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /¡Gracias!|Thank you!/i })).toBeVisible({
      timeout: 60_000,
    });
    await anon.close();

    await gotoIsolated(adminPage, `${eventPath}?tab=codes`);
    const codeRow = adminPage.locator("tr").filter({ hasText: code }).first();
    await codeRow.getByRole("button", { name: /Ver quién lo usó|Show who used it/i }).click();
    const reservedRow = adminPage.locator("tr").filter({ hasText: email });
    await expect(reservedRow).toBeVisible({ timeout: 20_000 });
    await expect(reservedRow.getByText(/^(Reservado|Reserved)$/)).toBeVisible();
    await expect(reservedRow.getByText(/^(Pago pendiente|Payment pending)$/)).toBeVisible();

    await gotoIsolated(
      adminPage,
      `${eventPath}?tab=payments&paymentStatus=pending&paymentsQ=${encodeURIComponent(email)}`,
    );
    const payRow = adminPage.locator("li").filter({ hasText: email }).first();
    await expect(payRow).toBeVisible({ timeout: 30_000 });
    const approveBtn = payRow
      .getByRole("button", { name: /OK — Pagado|OK — Paid/i })
      .or(payRow.locator(`[data-tour="admin-event-payment-approve"]`));
    await expect(async () => {
      if (await payRow.getByText(/Pendiente|Pending/i).isVisible().catch(() => false)) {
        await approveBtn.first().click({ timeout: 5_000 });
      }
      await expect(payRow.getByText(/Pendiente|Pending/i)).toBeHidden({ timeout: 12_000 });
    }).toPass({ timeout: 60_000 });

    await gotoIsolated(adminPage, `${eventPath}?tab=codes`);
    const after = adminPage.locator("tr").filter({ hasText: code }).first();
    await after.getByRole("button", { name: /Ver quién lo usó|Show who used it/i }).click();
    const confirmedRow = adminPage.locator("tr").filter({ hasText: email });
    await expect(confirmedRow).toBeVisible({ timeout: 20_000 });
    await expect(confirmedRow.getByText(/^(Confirmado|Confirmed)$/)).toBeVisible();
    await expect(confirmedRow.getByText(/^(Pago aprobado|Payment approved)$/)).toBeVisible();
    await adminCtx.close();
  });
});

async function openPaidEvent(page: Page, locale: string): Promise<string> {
  await gotoIsolated(page, `/${locale}/dashboard/admin/events?q=e2e-paid-event`);
  const manage = page.getByRole("link", { name: /Gestionar|Manage/i }).first();
  if (!(await manage.isVisible().catch(() => false))) {
    await page.reload({ waitUntil: "domcontentloaded" });
  }
  await expect(manage).toBeVisible({ timeout: 45_000 });
  const href = await manage.getAttribute("href");
  expect(href).toMatch(/\/dashboard\/admin\/events\/[0-9a-f-]{36}/i);
  const eventPath = href!.split("?")[0];
  await gotoIsolated(page, eventPath);
  return eventPath;
}

import { test, expect } from "@playwright/test";
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

test.describe("@critical-event-attendee-remove", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
    test.skip(!existsSync(receiptFixture), "Missing e2e/fixtures/receipt-tiny.png");
  });

  test("admin removes a pending transfer attendee", async ({ browser }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const lastName = `Rm${suffix}`;
    const email = `e2e-paid-rm-${suffix}@example.test`;

    const anon = await browser.newContext();
    const page = await anon.newPage();
    await gotoIsolated(page, `/${locale}/events/e2e-paid-event/register`);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /404/i })).toHaveCount(0);

    await page.getByRole("textbox", { name: /Nombre|First name/i }).fill("E2E");
    await page.getByRole("textbox", { name: /Apellido|Last name/i }).fill(lastName);
    await page
      .getByRole("textbox", { name: /Documento|ID \/ RUT|DNI/i })
      .fill(`E2ERM${suffix}`.slice(0, 12));
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

    const thankYou = page.getByRole("dialog");
    await expect(thankYou).toBeVisible({ timeout: 60_000 });
    await expect(
      thankYou.getByRole("heading", { name: /¡Gracias!|Thank you!/i }),
    ).toBeVisible();
    await anon.close();

    const adminCtx = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await adminCtx.newPage();

    const paidEventId =
      process.env.E2E_PAID_EVENT_ID?.trim() || process.env.E2E_EVENT_ID?.trim() || "";
    let eventPath = paidEventId
      ? `/${locale}/dashboard/admin/events/${paidEventId}`
      : "";

    if (!eventPath) {
      await gotoIsolated(adminPage, `/${locale}/dashboard/admin/events?q=e2e-paid-event`);
      const manage = adminPage.getByRole("link", { name: /Gestionar|Manage/i }).first();
      if (!(await manage.isVisible().catch(() => false))) {
        await adminPage.reload({ waitUntil: "domcontentloaded" });
      }
      await expect(manage).toBeVisible({ timeout: 45_000 });
      const manageHref = await manage.getAttribute("href");
      expect(manageHref).toMatch(/\/dashboard\/admin\/events\/[0-9a-f-]{36}/i);
      eventPath = manageHref!.split("?")[0];
    }

    await gotoIsolated(
      adminPage,
      `${eventPath}?tab=attendees&attendeesQ=${encodeURIComponent(lastName)}`,
    );

    const row = adminPage.locator("tr").filter({ hasText: lastName }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });

    // Accessible name comes from deleteTooltip (aria-label), not attendeesDelete text.
    const deleteBtn = row.getByRole("button", {
      name: /Eliminar permanentemente|Permanently remove|Eliminar asistente|Remove attendee|Delete attendee/i,
    });
    await expect(deleteBtn).toBeVisible({ timeout: 15_000 });
    await deleteBtn.click();

    const confirmDialog = adminPage.getByRole("dialog");
    await expect(confirmDialog).toBeVisible({ timeout: 10_000 });
    await confirmDialog
      .getByRole("button", { name: /Eliminar asistente|Remove attendee|Delete attendee/i })
      .click();

    await expect(adminPage.locator("tr").filter({ hasText: lastName })).toHaveCount(0, {
      timeout: 30_000,
    });
    await adminCtx.close();
  });
});

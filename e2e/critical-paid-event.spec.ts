import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";

const isolation = resolveE2eIsolation();
const receiptFixture = path.join(__dirname, "fixtures", "receipt-tiny.png");

test.describe("@critical-paid-event", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!existsSync(receiptFixture), "Missing e2e/fixtures/receipt-tiny.png");
  });

  test("anonymous paid event register with bank-transfer proof shows success", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const email = `e2e-paid-${suffix}@example.test`;

    await page.goto(`/${locale}/events/e2e-paid-event/register`);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("heading", { name: /404/i })).toHaveCount(0);

    await page.getByRole("textbox", { name: /Nombre|First name/i }).fill("E2E");
    await page.getByRole("textbox", { name: /Apellido|Last name/i }).fill(`Paid${suffix}`);
    await page
      .getByRole("textbox", { name: /Documento|ID \/ RUT|DNI/i })
      .fill(`E2EPAID${suffix}`.slice(0, 12));
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
    await expect(
      dialog.getByText(/inscripción fue enviada|submitted successfully/i),
    ).toBeVisible();
  });
});

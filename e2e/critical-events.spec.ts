import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const isolation = resolveE2eIsolation();

test.describe("@critical-events", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
  });

  test("anonymous free event register shows success dialog", async ({ page }) => {
    test.setTimeout(90_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const email = `e2e-evt-${suffix}@example.test`;

    await gotoIsolated(page, `/${locale}/events/e2e-free-event/register`);
    await expect(page.getByRole("heading").first()).toBeVisible({ timeout: 20_000 });

    await page.getByRole("textbox", { name: /Nombre|First name/i }).fill("E2E");
    await page.getByRole("textbox", { name: /Apellido|Last name/i }).fill(`Evt${suffix}`);
    await page
      .getByRole("textbox", { name: /Documento|ID \/ RUT|DNI/i })
      .fill(`E2EEVT${suffix}`.slice(0, 12));
    await page.getByRole("textbox", { name: /Email|Correo/i }).fill(email);
    await page.getByRole("checkbox", { name: /Acepto|I accept/i }).check();

    await page
      .getByRole("button", { name: /Enviar inscripción|Submit registration/i })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 30_000 });
    await expect(
      dialog.getByRole("heading", { name: /¡Gracias!|Thank you!/i }),
    ).toBeVisible();
    await expect(
      dialog.getByText(/inscripción fue enviada|submitted successfully/i),
    ).toBeVisible();
  });
});

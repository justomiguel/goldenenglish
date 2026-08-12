import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

/**
 * Opens collections bulk compose with recipients prefilled (selection count).
 * Does not send — product has no dry-run preview; EMAIL_PROVIDER=recording on the
 * webServer, but we never click Enviar / overdue mail.
 */
test.describe("@critical-collections-bulk", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin opens bulk message compose with recipients, does not send", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const sectionId = process.env.E2E_SECTION_ID?.trim();
    test.skip(
      !sectionId,
      "E2E_SECTION_ID missing — re-run e2e:stack:up",
    );

    await gotoIsolated(
      page,
      `/${locale}/dashboard/admin/finance/collections/${sectionId}`,
    );
    await expect(page.getByRole("heading").first()).toBeVisible({
      timeout: 20_000,
    });

    const selectOverdue = page.getByRole("button", {
      name: /Seleccionar alumnos con vencidos|Select overdue/i,
    });
    await expect(selectOverdue).toBeVisible({ timeout: 15_000 });

    if (await selectOverdue.isEnabled()) {
      await selectOverdue.click();
    } else {
      const studentCheckbox = page
        .getByRole("checkbox", { name: /Seleccionar alumno.*Student\s+E2E|Select student.*Student\s+E2E/i })
        .first();
      await expect(studentCheckbox).toBeVisible({ timeout: 15_000 });
      await studentCheckbox.check();
    }

    await expect(
      page.getByText(/\d+\s+seleccionados|\d+\s+selected/i).first(),
    ).toBeVisible({ timeout: 10_000 });

    await page
      .getByRole("button", {
        name: /Enviar mensaje masivo|Send bulk message/i,
      })
      .click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    await expect(
      dialog.getByRole("heading", {
        name: /Enviar mensaje masivo|Send bulk message/i,
      }),
    ).toBeVisible();
    await expect(
      dialog.getByText(/\d+\s+seleccionados|\d+\s+selected/i),
    ).toBeVisible();
    await expect(dialog.locator(".ProseMirror")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      dialog.getByRole("button", { name: /Enviar|Send/i }),
    ).toBeVisible();

    // Degrade path complete: compose open with recipients — do not send.
    await dialog
      .getByRole("button", { name: /Cancelar|Cancel/i })
      .click();
    await expect(dialog).toBeHidden({ timeout: 10_000 });
  });
});

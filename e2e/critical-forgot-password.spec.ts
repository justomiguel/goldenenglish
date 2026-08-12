import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";
import {
  clearRecordedEmails,
  extractResetUrlFromHtml,
  fetchRecordedEmails,
} from "./helpers/recordedEmails";

const isolation = resolveE2eIsolation();

/**
 * Seeded enrollee used only for admin enroll/unenroll UI — not in auth.setup
 * student storage. Safe to reset mid-suite without breaking later student specs.
 */
const THROW_AWAY_EMAIL = "e2e-student-b@example.test";

test.describe("@critical-forgot-password", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
  });

  test("seeded student-b: forgot-password → recorded email → reset → login", async ({
    browser,
    request,
  }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const newPassword = `E2eReset!${Date.now().toString(36)}`;

    await clearRecordedEmails(request);

    const anonCtx = await browser.newContext();
    const forgotPage = await anonCtx.newPage();
    await gotoIsolated(forgotPage, `/${locale}/forgot-password`);
    await expect(
      forgotPage.getByRole("heading", { name: /Restablecer contraseña|Reset password|Forgot/i }),
    ).toBeVisible({ timeout: 20_000 });
    await forgotPage.getByLabel(/Correo electrónico|Email/i).fill(THROW_AWAY_EMAIL);
    await forgotPage.getByRole("button", { name: /Enviar enlace|Send (reset )?link|Send/i }).click();
    await expect(
      forgotPage.getByRole("heading", { name: /Revisá tu casilla|Check your (email|inbox)|inbox/i }),
    ).toBeVisible({ timeout: 30_000 });

    let resetUrl: string | null = null;
    await expect
      .poll(
        async () => {
          const emails = await fetchRecordedEmails(request);
          const match = [...emails]
            .reverse()
            .find((e) => e.to.toLowerCase() === THROW_AWAY_EMAIL);
          if (!match) return `pending:${emails.length}`;
          resetUrl = extractResetUrlFromHtml(match.html);
          return resetUrl ?? `no-href:${match.subject}`;
        },
        { timeout: 30_000 },
      )
      .toMatch(/^https?:\/\//);
    expect(resetUrl, "recorded password-reset email missing action href").toBeTruthy();

    const resetPage = await anonCtx.newPage();
    await resetPage.goto(resetUrl!, { waitUntil: "domcontentloaded", timeout: 60_000 });

    const passwordField = resetPage.getByRole("textbox", {
      name: /^Nueva contraseña|^New password/i,
      exact: true,
    });
    const confirmField = resetPage.getByRole("textbox", {
      name: /Repetí la nueva contraseña|Confirm (the )?new password|Repeat/i,
    });
    await expect(passwordField).toBeVisible({ timeout: 60_000 });
    await passwordField.fill(newPassword);
    await confirmField.fill(newPassword);
    await resetPage.getByRole("button", { name: /Guardar y entrar|Save and (sign )?in|Save/i }).click();

    await resetPage.waitForURL(new RegExp(`/${locale}/dashboard`), { timeout: 60_000 });
    await expect(resetPage).toHaveURL(new RegExp(`/${locale}/dashboard`));
    await anonCtx.close();

    const loginCtx = await browser.newContext();
    const loginPage = await loginCtx.newPage();
    await gotoIsolated(loginPage, `/${locale}/login`);
    await loginPage.getByLabel(/email|correo/i).fill(THROW_AWAY_EMAIL);
    await loginPage.locator('input[type="password"]').fill(newPassword);
    await loginPage.getByRole("button", { name: /sign in|iniciar|entrar|login/i }).click();
    await loginPage.waitForURL(new RegExp(`/${locale}/dashboard`), { timeout: 60_000 });
    await expect(loginPage).toHaveURL(new RegExp(`/${locale}/dashboard`));
    await loginCtx.close();
  });
});

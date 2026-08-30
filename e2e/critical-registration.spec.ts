import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { normalizeDni } from "../src/lib/import/studentImportUtils";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";
import {
  chooseRegisterSectionByName,
  continueRegisterAfterStudent,
  pickRegisterBirthIso,
  submitRegisterAfterDetails,
} from "./helpers/registerForm";
import { chooseJoinBillingCurrent } from "./helpers/acceptRegistration";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

test.describe("@critical-registration", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("public register → admin accept → student can log in", async ({ browser }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const email = `e2e-reg-${suffix}@example.test`;
    const dni = `E2ER${suffix}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
    const loginPassword = normalizeDni(dni).password;

    const anon = await browser.newContext();
    const registerPage = await anon.newPage();
    await gotoIsolated(registerPage, `/${locale}/register`);
    await expect(registerPage.locator("#rg-fn")).toBeVisible({ timeout: 20_000 });
    await registerPage.locator("#rg-fn").fill("E2E");
    await registerPage.locator("#rg-ln").fill(`Reg${suffix}`);
    await pickRegisterBirthIso(registerPage, "1990-06-15");
    await registerPage.locator("#rg-dni").fill(dni);
    await continueRegisterAfterStudent(registerPage);
    await expect(registerPage.locator("#rg-em")).toBeVisible({ timeout: 20_000 });
    await registerPage.locator("#rg-em").fill(email);
    await registerPage.locator("#rg-ph").fill("+5491112345678");
    await chooseRegisterSectionByName(registerPage, /E2E Section A/i);
    await submitRegisterAfterDetails(registerPage);
    const successDialog = registerPage.getByRole("dialog");
    const formAlert = registerPage.getByRole("alert");
    await expect(successDialog.or(formAlert)).toBeVisible({ timeout: 45_000 });
    await expect(successDialog).toBeVisible({ timeout: 5_000 });
    await anon.close();

    const admin = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await admin.newPage();
    await gotoIsolated(adminPage, `/${locale}/dashboard/admin/registrations`);
    // The list identifies a lead by name and document; the email now lives in the
    // expandable panel, so filtering the row by email would never match.
    const row = adminPage.locator("tr, li, article").filter({ hasText: dni }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });

    // The phone the family typed has to be readable without opening any modal.
    await expect(row).toContainText("+5491112345678");

    // Follow-up: mark contacted, then accept. A contacted lead must stay acceptable.
    await row.getByRole("button", { name: /Marcar contactado|Mark contacted|Marcar contatado/i }).click();
    const contactedRow = adminPage.locator("tr, li, article").filter({ hasText: dni }).first();
    // The control flips to "mark pending" only once the server actually saved the
    // new status, so this is a real round-trip and not just optimistic UI.
    await expect(
      contactedRow.getByRole("button", {
        name: /Marcar pendiente|Mark as pending|Marcar pendente/i,
      }),
    ).toBeVisible({ timeout: 30_000 });
    await contactedRow.getByRole("button", { name: /Dar de alta|enroll as|accept/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await chooseJoinBillingCurrent(dialog);
    await dialog.getByRole("button", { name: /Dar de alta|enroll as|accept/i }).click();
    // Accept may close the modal (no section step) or show the section picker.
    const skipSection = dialog.getByRole("button", {
      name: /Omitir por ahora|omit|skip|después|later/i,
    });
    await expect
      .poll(
        async () => {
          if (await dialog.getByRole("alert").isVisible().catch(() => false)) {
            return "error";
          }
          if (!(await dialog.isVisible().catch(() => false))) return "closed";
          if (await skipSection.isVisible().catch(() => false)) return "section";
          return "pending";
        },
        { timeout: 60_000 },
      )
      .not.toBe("pending");
    if (await dialog.getByRole("alert").isVisible().catch(() => false)) {
      throw new Error(
        `accept failed: ${await dialog.getByRole("alert").innerText()}`,
      );
    }
    if (await skipSection.isVisible().catch(() => false)) {
      await skipSection.click();
      await expect(dialog).toBeHidden({ timeout: 20_000 });
    }
    await admin.close();

    const loginCtx = await browser.newContext();
    const loginPage = await loginCtx.newPage();
    await gotoIsolated(loginPage, `/${locale}/login`);
    await loginPage.getByLabel(/email|correo/i).fill(email);
    await loginPage.locator('input[type="password"]').fill(loginPassword);
    await loginPage.getByRole("button", { name: /sign in|iniciar|entrar|login/i }).click();
    await loginPage.waitForURL(new RegExp(`/${locale}/dashboard`), { timeout: 60_000 });
    await expect(loginPage).toHaveURL(new RegExp(`/${locale}/dashboard`));
    await loginCtx.close();
  });
});

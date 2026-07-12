import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { normalizeDni } from "../src/lib/import/studentImportUtils";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

async function pickAdultBirthDate(page: import("@playwright/test").Page) {
  await page.locator("#rg-birth-year").selectOption("1990");
  await page.locator("#rg-birth-month").selectOption("5"); // June (0-based)
  const dayTrigger = page.locator("#rg-birth-day-trigger");
  if ((await dayTrigger.getAttribute("aria-expanded")) !== "true") {
    await dayTrigger.click();
  }
  // DayPicker may animate adjacent months; pick by full date aria-label.
  await page
    .locator("#rg-birth-calendar-panel")
    .getByRole("button", { name: /15 de junio de 1990|June 15,? 1990|15 de junho de 1990/i })
    .click();
  await expect(page.locator('input[name="birth_date"]')).toHaveValue("1990-06-15");
}

test.describe("@critical-registration", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("public register → admin accept → student can log in", async ({ browser }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const email = `e2e-reg-${suffix}@example.test`;
    const dni = `E2ER${suffix}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
    const loginPassword = normalizeDni(dni).password;

    const anon = await browser.newContext();
    const registerPage = await anon.newPage();
    await registerPage.goto(`/${locale}/register`);
    await expect(registerPage.locator("#rg-fn")).toBeVisible({ timeout: 20_000 });
    await registerPage.locator("#rg-fn").fill("E2E");
    await registerPage.locator("#rg-ln").fill(`Reg${suffix}`);
    await pickAdultBirthDate(registerPage);
    await expect(registerPage.locator("#rg-em")).toBeVisible();
    await registerPage.locator("#rg-dni").fill(dni);
    await registerPage.locator("#rg-em").fill(email);
    await registerPage.locator("#rg-ph").fill("+5491112345678");
    await registerPage.locator("#rg-section").selectOption({ index: 1 });
    await registerPage.getByRole("button", { name: /enviar|submit|inscrib/i }).click();
    await expect(registerPage.getByRole("dialog")).toBeVisible({ timeout: 30_000 });
    await anon.close();

    const admin = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await admin.newPage();
    await adminPage.goto(`/${locale}/dashboard/admin/registrations`);
    const row = adminPage.locator("tr, li, article").filter({ hasText: email }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await row.getByRole("button", { name: /Dar de alta|enroll as|accept/i }).click();
    const dialog = adminPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15_000 });
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
    await loginPage.goto(`/${locale}/login`);
    await loginPage.getByLabel(/email|correo/i).fill(email);
    await loginPage.locator('input[type="password"]').fill(loginPassword);
    await loginPage.getByRole("button", { name: /sign in|iniciar|entrar|login/i }).click();
    await loginPage.waitForURL(new RegExp(`/${locale}/dashboard`), { timeout: 60_000 });
    await expect(loginPage).toHaveURL(new RegExp(`/${locale}/dashboard`));
    await loginCtx.close();
  });
});

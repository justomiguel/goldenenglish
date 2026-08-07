import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  e2eSharedPassword,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

test.describe("@critical-auth", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin storage lands on admin hub", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.storageState });
    const page = await ctx.newPage();
    await gotoIsolated(page, `/${locale}/dashboard`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/admin`));
    await ctx.close();
  });

  test("student storage lands on student portal", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.studentStorageState });
    const page = await ctx.newPage();
    await gotoIsolated(page, `/${locale}/dashboard`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/student`));
    await ctx.close();
  });

  test("parent storage lands on parent portal", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.parentStorageState });
    const page = await ctx.newPage();
    await gotoIsolated(page, `/${locale}/dashboard`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/parent`));
    await ctx.close();
  });

  test("student cannot open admin finance", async ({ browser }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.studentStorageState });
    const page = await ctx.newPage();
    await gotoIsolated(page, `/${locale}/dashboard/admin/finance`, {
      timeout: 45_000,
      attempts: 3,
    });
    // Middleware redirect can lag behind cold webpack; poll until finance is denied.
    await expect
      .poll(() => page.url(), { timeout: 60_000 })
      .not.toMatch(new RegExp(`/${locale}/dashboard/admin/finance(?:/|\\?|$)`));
    await ctx.close();
  });

  test("wrong password stays on login", async ({ page }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const email = process.env.E2E_ADMIN_EMAIL!.trim();
    await gotoIsolated(page, `/${locale}/login`, { timeout: 90_000, attempts: 4 });
    await expect(page.getByLabel(/email|correo/i)).toBeVisible({ timeout: 30_000 });
    await page.getByLabel(/email|correo/i).fill(email);
    await page.locator('input[type="password"]').fill("DefinitelyWrong!Pass9");
    await page.getByRole("button", { name: /sign in|iniciar|entrar|login/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`), { timeout: 30_000 });
    // Shared password must still work for fixtures (sanity of seed).
    expect(e2eSharedPassword().length).toBeGreaterThan(8);
  });
});

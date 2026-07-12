import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  e2eSharedPassword,
  resolveE2eIsolation,
} from "./env";

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
    await page.goto(`/${locale}/dashboard`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/admin`));
    await ctx.close();
  });

  test("student storage lands on student portal", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.studentStorageState });
    const page = await ctx.newPage();
    await page.goto(`/${locale}/dashboard`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/student`));
    await ctx.close();
  });

  test("parent storage lands on parent portal", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.parentStorageState });
    const page = await ctx.newPage();
    await page.goto(`/${locale}/dashboard`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/parent`));
    await ctx.close();
  });

  test("student cannot open admin finance", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.studentStorageState });
    const page = await ctx.newPage();
    await page.goto(`/${locale}/dashboard/admin/finance`);
    await page.waitForLoadState("domcontentloaded");
    await expect(page).not.toHaveURL(new RegExp(`/${locale}/dashboard/admin/finance`));
    await ctx.close();
  });

  test("wrong password stays on login", async ({ page }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const email = process.env.E2E_ADMIN_EMAIL!.trim();
    await page.goto(`/${locale}/login`);
    await page.getByLabel(/email|correo/i).fill(email);
    await page.locator('input[type="password"]').fill("DefinitelyWrong!Pass9");
    await page.getByRole("button", { name: /sign in|iniciar|entrar|login/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/login`));
    // Shared password must still work for fixtures (sanity of seed).
    expect(e2eSharedPassword().length).toBeGreaterThan(8);
  });
});

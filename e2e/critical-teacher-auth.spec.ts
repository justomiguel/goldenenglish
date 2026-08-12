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

test.describe("@critical-teacher-auth", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("teacher storage lands on teacher hub", async ({ browser }) => {
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.teacherStorageState });
    const page = await ctx.newPage();
    await gotoIsolated(page, `/${locale}/dashboard`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/teacher`));
    await ctx.close();
  });

  test("teacher cannot open admin finance", async ({ browser }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.teacherStorageState });
    const page = await ctx.newPage();
    await gotoIsolated(page, `/${locale}/dashboard/admin/finance`, {
      timeout: 45_000,
      attempts: 3,
    });
    await expect
      .poll(() => page.url(), { timeout: 60_000 })
      .not.toMatch(new RegExp(`/${locale}/dashboard/admin/finance(?:/|\\?|$)`));
    await ctx.close();
  });
});

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
const COURSE_TITLE = "E2E Free Course";

test.describe("@critical-free-course", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("adult student enrolls in a free course and sees it on progress", async ({ browser }) => {
    test.setTimeout(120_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const ctx = await browser.newContext({ storageState: paths.studentStorageState });
    const page = await ctx.newPage();

    await gotoIsolated(page, `/${locale}/tienda/curso/e2e-free-course`);
    await expect(page.getByRole("heading", { name: COURSE_TITLE })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: /Inscribirme|Enroll/i }).click();
    await expect
      .poll(
        async () => {
          if (page.url().includes("tab=courses")) return "done";
          const formAlert = page.locator("form").getByRole("alert");
          if (await formAlert.isVisible().catch(() => false)) return await formAlert.innerText();
          return "pending";
        },
        { timeout: 30_000 },
      )
      .toBe("done");
    await expect(page.getByRole("heading", { name: COURSE_TITLE })).toBeVisible({ timeout: 30_000 });
    await ctx.close();
  });
});

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

test.describe("@critical-parent-ward-email", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("parent changes ward login email with password step-up", async ({ browser }) => {
    test.setTimeout(90_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const password = (process.env.E2E_USER_PASSWORD ?? "E2eLocal!Stack1").trim();
    const studentId = process.env.E2E_STUDENT_ID?.trim();
    // Parent home (inbox) no longer exposes FamilyView edit link — use seeded id.
    test.skip(!studentId, "E2E_STUDENT_ID missing — re-run e2e:stack:up");

    const suffix = Date.now().toString(36);
    const newEmail = `e2e-ward-${suffix}@example.test`;

    const parentCtx = await browser.newContext({
      storageState: paths.parentStorageState,
    });
    const page = await parentCtx.newPage();
    await gotoIsolated(page, `/${locale}/dashboard/parent/children/${studentId}`);
    await expect(page.locator("#ward-em")).toBeVisible({ timeout: 20_000 });

    await page.locator("#ward-em").fill(newEmail);
    await expect(page.locator("#ward-parent-pw")).toBeVisible({ timeout: 10_000 });
    await page.locator("#ward-parent-pw").fill(password);

    const phone = page.locator("#ward-ph");
    if ((await phone.inputValue()).trim().length === 0) {
      await phone.fill("+5491100000000");
    }
    const birth = page.locator("#ward-bd");
    if (await birth.count()) {
      if ((await birth.inputValue()).trim().length === 0) {
        // Adult DOB — minors lose student payments module access.
        await birth.fill("2000-06-15");
      }
    }

    const saveBtn = page.getByRole("button", { name: /Guardar cambios|Save changes/i });
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();
    // Prefer success status; form errors use role="alert" (do not match password label copy).
    const saved = page.getByRole("status").filter({ hasText: /Guardado|Saved/i });
    const formErr = page.getByRole("alert");
    await expect(saved.or(formErr)).toBeVisible({ timeout: 45_000 });
    await expect(saved).toBeVisible({ timeout: 5_000 });
    await expect(page.locator("#ward-em")).toHaveValue(newEmail);
    await parentCtx.close();
  });
});

import { test as setup, expect, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from "node:fs";
import { dirname } from "node:path";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  e2eSharedPassword,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();

function clearReady(): void {
  if (existsSync(paths.readyMarker)) unlinkSync(paths.readyMarker);
}

async function loginOnPage(
  page: Page,
  locale: string,
  email: string,
  password: string,
): Promise<void> {
  const emailField = page.getByLabel(/email|correo/i);
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await gotoIsolated(page, `/${locale}/login`);
      // Cold webpack compile can 500 once; reload recovers.
      if (!(await emailField.isVisible({ timeout: 15_000 }).catch(() => false))) {
        await page.reload({ waitUntil: "domcontentloaded" });
      }
      await expect(emailField).toBeVisible({ timeout: 30_000 });
      await emailField.fill(email);
      await page.locator('input[type="password"]').fill(password);
      await page.getByRole("button", { name: /sign in|iniciar|entrar|login/i }).click();
      await page.waitForURL(new RegExp(`/${locale}/dashboard`), { timeout: 60_000 });
      await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard`));
      return;
    } catch (err) {
      lastError = err;
      if (attempt === 3) break;
      await page.waitForTimeout(1_500);
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * Authenticates roles when E2E_STACK=isolated.
 * With E2E_REQUIRE=1 (precommit): isolation failure throws — never skip.
 */
setup("authenticate roles on isolated e2e stack", async ({ browser }) => {
  setup.setTimeout(180_000);
  mkdirSync(paths.dir, { recursive: true });
  clearReady();

  const requireFailure = e2eRequireFailureMessage();
  if (requireFailure) {
    throw new Error(requireFailure);
  }

  const isolation = resolveE2eIsolation();
  if (!isolation.ok) {
    for (const p of [
      paths.storageState,
      paths.studentStorageState,
      paths.parentStorageState,
      paths.teacherStorageState,
    ]) {
      mkdirSync(dirname(p), { recursive: true });
      writeFileSync(p, JSON.stringify({ cookies: [], origins: [] }));
    }
    setup.skip(true, isolation.reason);
    return;
  }

  const { locale } = isolation;
  const password = e2eSharedPassword();
  const adminEmail = process.env.E2E_ADMIN_EMAIL!.trim();
  const studentEmail = (process.env.E2E_STUDENT_EMAIL ?? "e2e-student@example.test").trim();
  const parentEmail = (process.env.E2E_PARENT_EMAIL ?? "e2e-parent@example.test").trim();

  const adminCtx = await browser.newContext();
  const adminPage = await adminCtx.newPage();
  await loginOnPage(adminPage, locale, adminEmail, password);
  await adminCtx.storageState({ path: paths.storageState });
  await adminCtx.close();

  const studentCtx = await browser.newContext();
  const studentPage = await studentCtx.newPage();
  await loginOnPage(studentPage, locale, studentEmail, password);
  await studentCtx.storageState({ path: paths.studentStorageState });
  await studentCtx.close();

  const parentCtx = await browser.newContext();
  const parentPage = await parentCtx.newPage();
  await loginOnPage(parentPage, locale, parentEmail, password);
  await parentCtx.storageState({ path: paths.parentStorageState });
  await parentCtx.close();

  const teacherEmail = (process.env.E2E_TEACHER_EMAIL ?? "e2e-teacher@example.test").trim();

  const teacherCtx = await browser.newContext();
  const teacherPage = await teacherCtx.newPage();
  await loginOnPage(teacherPage, locale, teacherEmail, password);
  await teacherCtx.storageState({ path: paths.teacherStorageState });
  await teacherCtx.close();

  writeFileSync(paths.readyMarker, "1");
});

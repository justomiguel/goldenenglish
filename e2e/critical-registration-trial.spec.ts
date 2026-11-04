import { test, expect, type Page } from "@playwright/test";
import { existsSync } from "node:fs";
import { adminHomeOpsWindow } from "../src/lib/dashboard/adminHomeOpsWindow";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";
import {
  chooseRegisterSectionByName,
  completeRegisterDniStep,
  continueRegisterAfterStudent,
  pickRegisterBirthIso,
  submitTrialRegisterAfterDetails,
} from "./helpers/registerForm";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);
const INSTITUTE_TZ = "America/Argentina/Cordoba";

function dateInThisWeek(iso: string): boolean {
  const window = adminHomeOpsWindow(new Date(), INSTITUTE_TZ);
  return iso >= window.weekStart && iso <= window.weekEnd;
}

/** One trial section hides the picker and assigns that section. */
async function chooseOrAcceptTrialSection(page: Page) {
  const select = page.locator("#rg-section");
  const assigned = page.getByRole("note").filter({ hasText: /E2E Trial/ });
  await expect(select.or(assigned).first()).toBeVisible({ timeout: 20_000 });
  if (await select.isVisible().catch(() => false)) {
    await chooseRegisterSectionByName(page, /E2E Trial/i);
    return;
  }
  await expect(assigned).toBeVisible();
}

async function readTrialCard(page: Page): Promise<{ booked: number; attended: number }> {
  const card = page.getByRole("link", { name: /Pruebas de la semana|Trials this week/i });
  await expect(card).toBeVisible({ timeout: 60_000 });
  const text = await card.innerText();
  const hit =
    /(\d+)\s+reservadas\s+·\s+(\d+)\s+usadas/.exec(text) ??
    /(\d+)\s+booked\s+·\s+(\d+)\s+attended/.exec(text);
  if (!hit) throw new Error(`trial card line missing: ${text}`);
  return { booked: Number(hit[1]), attended: Number(hit[2]) };
}

test.describe("@critical-registration-trial", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("public trial booking shows on the admin home week card after attendance", async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const dni = `E2ET${suffix}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);
    const email = `e2e-trial-${suffix}@example.test`;

    const admin = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await admin.newPage();
    await gotoIsolated(adminPage, `/${locale}/dashboard/admin`);
    const before = await readTrialCard(adminPage);

    const anon = await browser.newContext();
    const registerPage = await anon.newPage();
    await gotoIsolated(registerPage, `/${locale}/register?intent=trial`);
    await expect(
      registerPage.getByRole("heading", { name: /Agenda tu clase de prueba|Book your trial class/i }),
    ).toBeVisible({ timeout: 30_000 });
    await completeRegisterDniStep(registerPage, dni);
    await registerPage.locator("#rg-fn").fill("E2E");
    await registerPage.locator("#rg-ln").fill(`Trial${suffix}`);
    await pickRegisterBirthIso(registerPage, "1990-06-15");
    await registerPage.locator("#rg-dni").fill(dni);
    await continueRegisterAfterStudent(registerPage);
    await expect(registerPage.locator("#rg-em")).toBeVisible({ timeout: 20_000 });
    await registerPage.locator("#rg-em").fill(email);
    await registerPage.locator("#rg-ph").fill("+5491112345678");
    await chooseOrAcceptTrialSection(registerPage);
    await submitTrialRegisterAfterDetails(registerPage);
    await expect(registerPage.getByRole("dialog")).toBeVisible({ timeout: 45_000 });
    await anon.close();

    await gotoIsolated(
      adminPage,
      `/${locale}/dashboard/admin/registrations?inbox=trial&q=${encodeURIComponent(dni)}`,
    );
    const dataRow = adminPage.locator("tr").filter({ hasText: dni }).first();
    await expect(dataRow).toBeVisible({ timeout: 30_000 });
    await dataRow.getByRole("button", { name: /Ver detalle|Show details/i }).click();
    const details = dataRow.locator("xpath=following-sibling::tr[1]");
    await expect(details).toContainText(/Reservada|Booked/);
    const scheduledOn = /(\d{4}-\d{2}-\d{2}) · \d{2}:\d{2}/.exec(await details.innerText())?.[1];
    if (!scheduledOn) throw new Error("trial seat date missing");
    const countsThisWeek = dateInThisWeek(scheduledOn);

    await gotoIsolated(adminPage, `/${locale}/dashboard/admin`);
    const booked = await readTrialCard(adminPage);
    if (countsThisWeek) {
      expect(booked.booked).toBe(before.booked + 1);
      expect(booked.attended).toBe(before.attended);
    } else {
      expect(booked).toEqual(before);
    }

    await gotoIsolated(
      adminPage,
      `/${locale}/dashboard/admin/registrations?inbox=trial&q=${encodeURIComponent(dni)}`,
    );
    const rowAgain = adminPage.locator("tr").filter({ hasText: dni }).first();
    await expect(rowAgain).toBeVisible({ timeout: 30_000 });
    await rowAgain.getByRole("button", { name: /Ver detalle|Show details/i }).click();
    const detailsAgain = rowAgain.locator("xpath=following-sibling::tr[1]");
    await detailsAgain.getByRole("button", { name: /^Presente$|^Present$/ }).click();
    await expect(detailsAgain).toContainText(/Vino|Attended/, { timeout: 30_000 });

    await gotoIsolated(adminPage, `/${locale}/dashboard/admin`);
    const attended = await readTrialCard(adminPage);
    if (countsThisWeek) {
      expect(attended.booked).toBe(before.booked);
      expect(attended.attended).toBe(before.attended + 1);
    } else {
      expect(attended).toEqual(before);
    }
    await admin.close();
  });
});

import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import es from "../src/dictionaries/es.json";
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
} from "./helpers/registerForm";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);
const L = es.dashboard.sectionEnrollmentLink;
const R = es.register;
const A = es.admin.registrations;

test.describe("@critical-registration", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("new minor can request two sections without an existing-student badge", async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const suffix = Date.now().toString(36);
    const dni = `E2EM${suffix}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 12);

    const anon = await browser.newContext();
    const page = await anon.newPage();
    await gotoIsolated(page, `/${locale}/register`);
    await page.locator("#rg-fn").fill("E2E");
    await page.locator("#rg-ln").fill(`Minor${suffix}`);
    await pickRegisterBirthIso(page, "2015-01-15");
    await page.locator("#rg-dni").fill(dni);
    await continueRegisterAfterStudent(page);
    await expect(page.getByText(R.tutorSectionTitle)).toBeVisible({ timeout: 20_000 });
    await page.locator("#rg-tn").fill("Marta Tutor");
    await page.locator("#rg-td").fill(`T${suffix}`.slice(0, 12));
    await page.locator("#rg-te").fill(`tutor-${suffix}@example.test`);
    await page.locator("#rg-tp").fill("+5491112345678");
    await page.locator("#rg-tr").fill("Madre");
    await chooseRegisterSectionByName(page, /E2E Section A/i);
    await chooseRegisterSectionByName(page, /E2E Section B/i);
    await page.getByRole("button", { name: R.submit }).click();
    const successDialog = page.getByRole("dialog");
    const formAlert = page.getByRole("alert");
    await expect(successDialog.or(formAlert)).toBeVisible({ timeout: 45_000 });
    await expect(successDialog).toBeVisible({ timeout: 5_000 });
    await anon.close();

    const admin = await browser.newContext({ storageState: paths.storageState });
    const adminPage = await admin.newPage();
    await gotoIsolated(adminPage, `/${locale}/dashboard/admin/registrations`);
    const row = adminPage.locator("tr, li, article").filter({ hasText: dni }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row).not.toContainText(A.existingStudentBadge);
    const expand = row.getByRole("button", { name: A.expandRow });
    if (await expand.isVisible().catch(() => false)) {
      await expand.click();
    }
    await expect(adminPage.getByText(/E2E Section A/i).first()).toBeVisible();
    await expect(adminPage.getByText(/E2E Section B/i).first()).toBeVisible();
    await admin.close();
  });

  test("existing student via invite confirms the stored name and reuses the ficha", async ({
    browser,
  }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const cohortId = process.env.E2E_COHORT_ID?.trim();
    const sectionId = process.env.E2E_SECTION_ID?.trim();
    test.skip(
      !cohortId || !sectionId,
      "E2E_COHORT_ID / E2E_SECTION_ID missing — re-run e2e:stack:up",
    );

    const staff = await browser.newContext({ storageState: paths.storageState });
    const staffPage = await staff.newPage();
    await gotoIsolated(
      staffPage,
      `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}`,
    );
    await expect(staffPage.getByRole("heading", { name: L.title })).toBeVisible({
      timeout: 45_000,
    });
    const urlField = staffPage.getByLabel(L.urlLabel);
    if (!(await urlField.isVisible().catch(() => false))) {
      await staffPage.getByRole("button", { name: L.generate }).click();
      await expect(urlField).toBeVisible({ timeout: 30_000 });
    }
    const inviteUrl = await urlField.inputValue();

    const family = await browser.newContext();
    const familyPage = await family.newPage();
    await familyPage.goto(inviteUrl, { waitUntil: "domcontentloaded" });
    await familyPage.locator("#rg-fn").fill("E2E");
    await familyPage.locator("#rg-ln").fill("EnrolleeB");
    await pickRegisterBirthIso(familyPage, "2010-03-04");
    await familyPage.locator("#rg-dni").fill("E2E-STU-B1");
    await continueRegisterAfterStudent(familyPage);
    await expect(familyPage.getByText(R.existingFoundTitle)).toBeVisible({
      timeout: 20_000,
    });
    await expect(familyPage.getByText(/E2E EnrolleeB/)).toBeVisible();
    await familyPage.getByRole("button", { name: R.existingYes }).click();
    await expect(familyPage.getByText(R.tutorSectionTitle)).toHaveCount(0);
    await chooseRegisterSectionByName(familyPage, /E2E Section B/i);
    await familyPage.getByRole("button", { name: R.submit }).click();
    await expect(familyPage.getByRole("dialog")).toBeVisible({ timeout: 45_000 });
    await family.close();

    await gotoIsolated(staffPage, `/${locale}/dashboard/admin/registrations`);
    const row = staffPage.locator("tr, li, article").filter({ hasText: "E2E-STU-B1" }).first();
    await expect(row).toBeVisible({ timeout: 30_000 });
    await expect(row).toContainText(A.existingStudentBadge);
    await row.getByRole("button", { name: /Dar de alta|enroll as|accept/i }).click();
    const dialog = staffPage.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByText(A.acceptExistingLead)).toBeVisible();
    await dialog.getByRole("button", { name: /Dar de alta|enroll as|accept/i }).click();
    const skipSection = dialog.getByRole("button", {
      name: /Omitir por ahora|omit|skip|después|later/i,
    });
    await expect
      .poll(
        async () => {
          if (await dialog.getByRole("alert").isVisible().catch(() => false)) return "error";
          if (!(await dialog.isVisible().catch(() => false))) return "closed";
          if (await skipSection.isVisible().catch(() => false)) return "section";
          return "pending";
        },
        { timeout: 60_000 },
      )
      .not.toBe("pending");
    if (await dialog.getByRole("alert").isVisible().catch(() => false)) {
      const text = await dialog.getByRole("alert").innerText();
      if (!text.includes(A.acceptPendingSections)) {
        throw new Error(`accept failed: ${text}`);
      }
    }
    if (await skipSection.isVisible().catch(() => false)) {
      await skipSection.click();
    }
    await gotoIsolated(
      staffPage,
      `/${locale}/dashboard/admin/users?q=${encodeURIComponent("e2e-student-b@example.test")}`,
    );
    await expect(staffPage.getByText("EnrolleeB").first()).toBeVisible({ timeout: 30_000 });
    await staff.close();
  });
});

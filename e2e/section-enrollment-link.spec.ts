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
  continueRegisterAfterStudent,
  pickRegisterBirthIso,
  submitRegisterAfterDetails,
} from "./helpers/registerForm";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);
const L = es.dashboard.sectionEnrollmentLink;
const SL = es.register.sectionLink;

test.describe("@critical-section-enrollment-link", () => {
  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("teacher/admin invite link → family registers → admin sees attribution; revoke closes the link", async ({
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

    const panel = staffPage.getByRole("heading", { name: L.title });
    await expect(panel).toBeVisible({ timeout: 45_000 });

    const urlField = staffPage.getByLabel(L.urlLabel);
    if (!(await urlField.isVisible().catch(() => false))) {
      await staffPage.getByRole("button", { name: L.generate }).click();
      await expect(urlField).toBeVisible({ timeout: 30_000 });
    }

    const inviteUrl = await urlField.inputValue();
    expect(inviteUrl).toMatch(new RegExp(`/${locale}/i/[a-z0-9-]+/[0-9a-f-]{36}`, "i"));
    const token = inviteUrl.split("/").filter(Boolean).pop();
    expect(token).toBeTruthy();

    // Ensure the link is active before the family opens it.
    const deactivateBtn = staffPage.getByRole("button", { name: L.deactivate });
    if (!(await deactivateBtn.isVisible().catch(() => false))) {
      await staffPage.getByRole("button", { name: L.activate }).click();
      await expect(deactivateBtn).toBeVisible({ timeout: 30_000 });
    }

    const family = await browser.newContext();
    const familyPage = await family.newPage();
    await familyPage.goto(`/${locale}/i/${token}`, { waitUntil: "domcontentloaded" });
    await expect(
      familyPage.getByRole("group", { name: SL.heading }),
    ).toBeVisible({ timeout: 45_000 });
    // Birth-date month/year are comboboxes; the section picker must stay gone.
    await expect(familyPage.locator("#rg-section")).toHaveCount(0);

    const suffix = Date.now().toString(36);
    await familyPage.locator("#rg-fn").fill("E2E");
    await familyPage.locator("#rg-ln").fill(`Link${suffix}`);
    await pickRegisterBirthIso(familyPage, "1990-06-15");
    await familyPage.locator("#rg-dni").fill(`E2EL${suffix}`.slice(0, 12));
    await continueRegisterAfterStudent(familyPage);
    await expect(familyPage.locator("#rg-em")).toBeVisible({ timeout: 20_000 });
    await familyPage.locator("#rg-em").fill(`e2e-link-${suffix}@example.test`);
    await familyPage.locator("#rg-ph").fill("+5491112345678");
    await submitRegisterAfterDetails(familyPage);
    await expect(familyPage.getByRole("dialog")).toBeVisible({ timeout: 45_000 });
    await family.close();

    await gotoIsolated(staffPage, `/${locale}/dashboard/admin/registrations`);
    await expect(staffPage.getByText(`Link${suffix}`)).toBeVisible({ timeout: 45_000 });
    await expect(staffPage.getByText(es.admin.registrations.viaSectionLink).first()).toBeVisible();

    await gotoIsolated(
      staffPage,
      `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}`,
    );
    await expect(staffPage.getByRole("heading", { name: L.title })).toBeVisible({
      timeout: 45_000,
    });
    await staffPage.getByRole("button", { name: L.deactivate }).click();
    await expect(staffPage.getByText(L.inactiveNotice)).toBeVisible({ timeout: 30_000 });

    const closed = await browser.newContext();
    const closedPage = await closed.newPage();
    await closedPage.goto(`/${locale}/i/${token}`, { waitUntil: "domcontentloaded" });
    await expect(
      closedPage.getByRole("heading", { name: SL.unavailableTitle }),
    ).toBeVisible({ timeout: 45_000 });
    await expect(closedPage.locator("#rg-fn")).toHaveCount(0);
    await closed.close();

    await staffPage.getByRole("button", { name: L.rotate }).click();
    await expect(
      staffPage.getByRole("dialog", { name: L.rotateConfirmTitle }),
    ).toBeVisible();
    await staffPage.getByRole("button", { name: L.rotateConfirm }).click();
    await expect
      .poll(async () => staffPage.getByLabel(L.urlLabel).inputValue(), {
        timeout: 45_000,
      })
      .not.toBe(inviteUrl);
    const newUrl = await staffPage.getByLabel(L.urlLabel).inputValue();

    const oldAgain = await browser.newContext();
    const oldPage = await oldAgain.newPage();
    await oldPage.goto(inviteUrl, { waitUntil: "domcontentloaded" });
    await expect(
      oldPage.getByRole("heading", { name: SL.unavailableTitle }),
    ).toBeVisible({ timeout: 45_000 });
    await oldAgain.close();

    const fresh = await browser.newContext();
    const freshPage = await fresh.newPage();
    await freshPage.goto(newUrl, { waitUntil: "domcontentloaded" });
    await expect(
      freshPage.getByRole("group", { name: SL.heading }),
    ).toBeVisible({ timeout: 45_000 });
    await fresh.close();
    await staff.close();
  });
});

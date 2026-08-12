import { test, expect } from "@playwright/test";
import { existsSync } from "node:fs";
import { adminTourSelector, ADMIN_TOUR_ANCHORS } from "../src/lib/admin-tutorials/selectors";
import es from "../src/dictionaries/es.json";
import {
  e2eAuthPaths,
  e2eRequireFailureMessage,
  resolveE2eIsolation,
} from "./env";
import { gotoIsolated } from "./helpers/gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const authReady = existsSync(paths.readyMarker);

/** Surname-first label for seeded e2e-student-b (EnrolleeB / E2E). */
const STUDENT_B_LABEL = /EnrolleeB\s+E2E/i;
const STUDENT_B_EMAIL = "e2e-student-b@example.test";
const SECTION_A_NAME = "E2E Section A";
const L = es.admin.users;
const rosterTabs = es.dashboard.academicSectionPage.tabs;

test.describe("@critical-section-unenroll", () => {
  test.use({ storageState: paths.storageState });

  test.beforeEach(() => {
    const requireFailure = e2eRequireFailureMessage();
    if (requireFailure) throw new Error(requireFailure);
    test.skip(!isolation.ok, isolation.ok ? "" : isolation.reason);
    test.skip(!authReady, "Auth storage not ready");
  });

  test("admin removes student-b from section → dropped roster", async ({ page }) => {
    test.setTimeout(180_000);
    const locale = isolation.ok ? isolation.locale : "es";
    const cohortId = process.env.E2E_COHORT_ID?.trim();
    const sectionId = process.env.E2E_SECTION_ID?.trim();
    test.skip(!cohortId || !sectionId, "E2E_COHORT_ID / E2E_SECTION_ID missing — re-run e2e:stack:up");

    const sectionStudentsPath = `/${locale}/dashboard/admin/academic/${cohortId}/${sectionId}?tab=students`;

    // --- Ensure EnrolleeB is active (fallback if enroll project did not run). ---
    await gotoIsolated(page, sectionStudentsPath);
    await expect(page.getByRole("heading", { name: /^404$/i })).toHaveCount(0);
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.sectionDetail))).toBeVisible({
      timeout: 60_000,
    });

    const activeRosterRow = page.getByRole("row", { name: /EnrolleeB\s+E2E.*\bactive\b/i });
    if (!(await activeRosterRow.count())) {
      const openEnroll = page
        .getByRole("region", { name: /Lista de la sección|Section roster|Section list/i })
        .getByRole("button", { name: /Inscribir alumno|Enroll student|Inscrever aluno/i });
      await expect(openEnroll).toBeVisible({ timeout: 15_000 });
      const enrollDialog = page.getByRole("dialog");
      await expect(async () => {
        if (await enrollDialog.isVisible().catch(() => false)) return;
        await openEnroll.click();
        await expect(enrollDialog).toBeVisible({ timeout: 3_000 });
      }).toPass({ timeout: 30_000 });

      const search = enrollDialog.locator("#academic-section-enroll-student");
      await expect(search).toBeVisible({ timeout: 15_000 });
      await search.click();
      await search.fill("");
      await search.fill("EnrolleeB");

      const pick = enrollDialog.getByRole("button", { name: STUDENT_B_LABEL }).first();
      await expect(pick).toBeVisible({ timeout: 30_000 });
      await pick.click();

      await enrollDialog.getByRole("button", { name: /^Inscribir$|^Enroll$|^Inscrever$/i }).click();
      await expect(activeRosterRow.first()).toBeVisible({ timeout: 45_000 });
    }

    // --- User detail: Quitar from current-cohort assignment card. ---
    await gotoIsolated(
      page,
      `/${locale}/dashboard/admin/users?q=${encodeURIComponent(STUDENT_B_EMAIL)}`,
    );
    const studentLink = page.getByRole("link", { name: STUDENT_B_LABEL }).first();
    await expect(studentLink).toBeVisible({ timeout: 30_000 });
    await studentLink.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/admin/users/[0-9a-f-]{36}`), {
      timeout: 30_000,
    });

    await page.getByRole("tab", { name: new RegExp(L.detailTabAcademic) }).click();
    await expect(
      page.getByRole("heading", { name: L.detailSectionAssignTitle }),
    ).toBeVisible({ timeout: 20_000 });

    const removeBtn = page.getByRole("button", {
      name: `${L.detailSectionAssignRemove} ${SECTION_A_NAME}`,
    });
    await expect(removeBtn).toBeVisible({ timeout: 20_000 });
    await removeBtn.click();

    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog.getByRole("heading", { name: L.detailSectionAssignRemoveTitle })).toBeVisible({
      timeout: 10_000,
    });
    await confirmDialog
      .getByRole("button", { name: L.detailSectionAssignRemove, exact: true })
      .click();

    await expect(page.getByRole("status").filter({ hasText: L.detailSectionAssignRemoved })).toBeVisible({
      timeout: 30_000,
    });
    await expect(removeBtn).toHaveCount(0);

    // --- Section roster dropped tab. ---
    await gotoIsolated(page, sectionStudentsPath);
    await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.sectionDetail))).toBeVisible({
      timeout: 60_000,
    });

    await page.getByRole("button", { name: rosterTabs.dropped, exact: true }).click();
    const droppedRow = page.getByRole("row", { name: /EnrolleeB\s+E2E.*\bdropped\b/i });
    await expect(droppedRow.first()).toBeVisible({ timeout: 30_000 });
  });
});

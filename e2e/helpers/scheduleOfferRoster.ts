import { expect, type Page } from "@playwright/test";
import { adminTourSelector, ADMIN_TOUR_ANCHORS } from "../../src/lib/admin-tutorials/selectors";
import es from "../../src/dictionaries/es.json";
import { gotoIsolated } from "./gotoIsolated";

export const STUDENT_B_LABEL = /EnrolleeB\s+E2E/i;
export const STUDENT_B_EMAIL = "e2e-student-b@example.test";
/** Seeded payments fixture (Section A); used to fill B without emptying Tiny. */
export const STUDENT_A_LABEL = /Student\s+E2E/i;
export const STUDENT_A_EMAIL = "e2e-student@example.test";

const ROSTER_STATUS_ACTIVE = String.raw`(?:\bactive\b|\bactivo\b|\bativo\b)`;
const ROSTER_STATUS_DROPPED = String.raw`(?:\bdropped\b|dado de baja|\bdesligado\b)`;

export function rosterRowName(label: RegExp, status: "active" | "dropped"): RegExp {
  const statusSource = status === "active" ? ROSTER_STATUS_ACTIVE : ROSTER_STATUS_DROPPED;
  return new RegExp(`${label.source}.*${statusSource}`, "i");
}

const U = es.admin.users;

export async function openCohortSections(page: Page, locale: string) {
  const cohortId = process.env.E2E_COHORT_ID?.trim();
  if (!cohortId) throw new Error("E2E_COHORT_ID missing — re-run e2e:stack:up");
  await gotoIsolated(page, `/${locale}/dashboard/admin/academic/${cohortId}`);
  const tab = page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.cohortSectionsTab));
  if (await tab.count()) await tab.first().click();
}

export async function sectionHrefByName(page: Page, locale: string, name: RegExp): Promise<string> {
  await openCohortSections(page, locale);
  const link = page.getByRole("link", { name });
  await expect(link).toBeVisible({ timeout: 20_000 });
  const href = await link.getAttribute("href");
  if (!href) throw new Error(`section link missing href: ${name}`);
  return href;
}

export async function dropStudentFromNamedSection(
  page: Page,
  locale: string,
  email: string,
  label: RegExp,
  sectionName: string,
) {
  await gotoIsolated(page, `/${locale}/dashboard/admin/users?q=${encodeURIComponent(email)}`);
  const studentLink = page.getByRole("link", { name: label }).first();
  await expect(studentLink).toBeVisible({ timeout: 30_000 });
  await studentLink.click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/dashboard/admin/users/[0-9a-f-]{36}`), {
    timeout: 30_000,
  });
  await page.getByRole("tab", { name: new RegExp(U.detailTabAcademic) }).click();
  const removeBtn = page.getByRole("button", { name: `${U.detailSectionAssignRemove} ${sectionName}` });
  if (!(await removeBtn.isVisible().catch(() => false))) return;
  await removeBtn.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: U.detailSectionAssignRemoveTitle })).toBeVisible({
    timeout: 10_000,
  });
  await dialog.getByRole("button", { name: U.detailSectionAssignRemove, exact: true }).click();
  await expect(page.getByRole("status").filter({ hasText: U.detailSectionAssignRemoved })).toBeVisible({
    timeout: 30_000,
  });
}

export async function dropStudentBFromNamedSection(page: Page, locale: string, sectionName: string) {
  await dropStudentFromNamedSection(page, locale, STUDENT_B_EMAIL, STUDENT_B_LABEL, sectionName);
}

export async function ensureSectionBOpen(page: Page, locale: string) {
  const href = await sectionHrefByName(page, locale, /E2E Section B/i);
  const config = `${href}${href.includes("?") ? "&" : "?"}tab=configuration`;
  await gotoIsolated(page, config);
  const cap = page.locator('input[id^="sec-cap-"]');
  if (await cap.isVisible({ timeout: 15_000 }).catch(() => false)) {
    const n = Number.parseInt((await cap.inputValue()).trim(), 10);
    if (Number.isFinite(n) && n <= 1) {
      await cap.fill("25");
      const save = page.getByRole("button", { name: /Guardar cupo|Save (capacity|cupo)/i });
      await expect(save).toBeEnabled({ timeout: 5_000 });
      await save.click();
      await expect(page.getByRole("status").filter({ hasText: /Cupo actualizado|updated/i })).toBeVisible({
        timeout: 20_000,
      });
    }
  }
  await dropStudentBFromNamedSection(page, locale, "E2E Section B");
  await dropStudentFromNamedSection(page, locale, STUDENT_A_EMAIL, STUDENT_A_LABEL, "E2E Section B");
}

export async function ensureTinyHasSeat(page: Page, locale: string) {
  const href = await sectionHrefByName(page, locale, /E2E Section Tiny/i);
  const students = href.includes("tab=") ? href : `${href}${href.includes("?") ? "&" : "?"}tab=students`;
  await gotoIsolated(page, students);
  await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.sectionDetail))).toBeVisible({
    timeout: 60_000,
  });
  if (await page.getByRole("row", { name: rosterRowName(STUDENT_B_LABEL, "active") }).count()) {
    await dropStudentBFromNamedSection(page, locale, "E2E Section Tiny");
  }
}

export async function enrollStudentIntoHref(
  page: Page,
  href: string,
  search: string,
  label: RegExp,
) {
  const students = href.includes("tab=") ? href : `${href}${href.includes("?") ? "&" : "?"}tab=students`;
  await gotoIsolated(page, students);
  await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.sectionDetail))).toBeVisible({
    timeout: 60_000,
  });
  const activeRosterRow = page.getByRole("row", { name: rosterRowName(label, "active") });
  if (await activeRosterRow.count()) {
    await expect(activeRosterRow.first()).toBeVisible();
    return;
  }
  const openEnroll = page
    .getByRole("region", { name: /Lista de la sección|Section roster|Section list/i })
    .getByRole("button", { name: /Inscribir alumno|Enroll student|Inscrever aluno/i });
  await expect(openEnroll).toBeVisible({ timeout: 15_000 });
  const dialog = page.getByRole("dialog");
  await expect(async () => {
    if (await dialog.isVisible().catch(() => false)) return;
    await openEnroll.click();
    await expect(dialog).toBeVisible({ timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
  const searchBox = dialog.locator("#academic-section-enroll-student");
  await expect(searchBox).toBeVisible({ timeout: 15_000 });
  await searchBox.click();
  await searchBox.fill("");
  await searchBox.fill(search);
  const pick = dialog.getByRole("button", { name: label }).first();
  await expect(pick).toBeVisible({ timeout: 30_000 });
  await pick.click();
  await dialog.getByRole("button", { name: /^Inscribir$|^Enroll$|^Inscrever$/i }).click();
  await expect(activeRosterRow.first()).toBeVisible({ timeout: 45_000 });
}

export async function enrollStudentBIntoHref(page: Page, href: string) {
  await enrollStudentIntoHref(page, href, "EnrolleeB", STUDENT_B_LABEL);
}

export async function enrollStudentAIntoHref(page: Page, href: string) {
  await enrollStudentIntoHref(page, href, "Student", STUDENT_A_LABEL);
}

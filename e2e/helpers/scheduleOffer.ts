import { expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { adminTourSelector, ADMIN_TOUR_ANCHORS } from "../../src/lib/admin-tutorials/selectors";
import es from "../../src/dictionaries/es.json";
import { e2eAuthPaths, resolveE2eIsolation } from "../env";
import { chooseRegisterSectionByName, continueRegisterAfterStudent, pickRegisterBirthIso, submitRegisterAfterDetails } from "./registerForm";
import { extractMatriculaUrlFromHtml } from "./extractMatriculaUrl";
import { clearRecordedEmails, fetchRecordedEmails } from "./recordedEmails";
import { gotoIsolated } from "./gotoIsolated";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();
const STUDENT_B_LABEL = /EnrolleeB\s+E2E/i;
const STUDENT_B_EMAIL = "e2e-student-b@example.test";
/** Seeded payments fixture (Section A); used to fill B without emptying Tiny. */
const STUDENT_A_LABEL = /Student\s+E2E/i;
const STUDENT_A_EMAIL = "e2e-student@example.test";
const U = es.admin.users;

export type ScheduleOfferLead = {
  email: string;
  dni: string;
  locale: string;
};

export type ProposedSchedule = ScheduleOfferLead & {
  admin: BrowserContext;
  adminPage: Page;
  offerHtml: string;
  payUrl: string;
};

function localeOf(): string {
  return isolation.ok ? isolation.locale : "es";
}

export function newScheduleOfferLead(): ScheduleOfferLead {
  const suffix = Date.now().toString(36);
  return {
    email: `e2e-offer-${suffix}@example.test`,
    dni: `E2EO${suffix}`.replace(/[^A-Za-z0-9]/g, "").slice(0, 12),
    locale: localeOf(),
  };
}

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
    // Only bump when dead-offer left B at max=1. Re-saving the same value leaves
    // Guardar cupo disabled (dirty=false) and hangs Playwright's click.
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
  if (await page.getByRole("row", { name: /EnrolleeB\s+E2E.*\bactive\b/i }).count()) {
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
  const activeRosterRow = page.getByRole("row", { name: new RegExp(`${label.source}.*\\bactive\\b`, "i") });
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

export async function registerAdultForTiny(page: Page, lead: ScheduleOfferLead) {
  await gotoIsolated(page, `/${lead.locale}/register`);
  await expect(page.locator("#rg-fn")).toBeVisible({ timeout: 20_000 });
  await page.locator("#rg-fn").fill("E2E");
  await page.locator("#rg-ln").fill(`Offer${lead.dni.slice(-6)}`);
  await pickRegisterBirthIso(page, "1990-06-15");
  await page.locator("#rg-dni").fill(lead.dni);
  await continueRegisterAfterStudent(page);
  await expect(page.locator("#rg-em")).toBeVisible({ timeout: 20_000 });
  await page.locator("#rg-em").fill(lead.email);
  await page.locator("#rg-ph").fill("+5491112345678");
  await chooseRegisterSectionByName(page, /E2E Section Tiny/i);
  await submitRegisterAfterDetails(page);
  const successDialog = page.getByRole("dialog");
  await expect(successDialog.or(page.getByRole("alert"))).toBeVisible({ timeout: 45_000 });
  await expect(successDialog).toBeVisible({ timeout: 5_000 });
}

export async function openAdminRegistrationByDni(
  page: Page,
  locale: string,
  dni: string,
  inbox: "urgent" | "awaiting_fee" | "section_full" | "offer_pending" = "awaiting_fee",
) {
  await gotoIsolated(
    page,
    `/${locale}/dashboard/admin/registrations?q=${encodeURIComponent(dni)}&inbox=${inbox}`,
  );
  const row = page.locator("tr, li, article").filter({ hasText: dni }).first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  return row;
}

export async function proposeSectionBForDni(page: Page, locale: string, dni: string) {
  // Tiny has a non-zero fee, so the lead sits in awaiting_fee until Proponer.
  const row = await openAdminRegistrationByDni(page, locale, dni, "awaiting_fee");
  await expect(row).toContainText(/Sección llena|Section full/i);
  const expand = row.getByRole("button", { name: /Ver detalle|Show details|Expand|Ver detalhes/i });
  if (await expand.isVisible().catch(() => false)) await expand.click();
  const propose = page.locator("select[id^='propose-']");
  await expect(propose).toBeVisible({ timeout: 15_000 });
  const option = propose.locator("option").filter({ hasText: /E2E Section B/i }).first();
  const value = await option.getAttribute("value");
  if (!value) throw new Error("E2E Section B missing from propose options");
  await propose.selectOption(value);
  const proposeCta = page.getByRole("button", { name: /^(Proponer|Propose|Propor)$/i });
  await proposeCta.click();
  // Success remounts the inbox row (CTA may disappear); failure re-enables the button.
  await expect
    .poll(
      async () => {
        if (!(await proposeCta.isVisible().catch(() => false))) return "done";
        return (await proposeCta.isEnabled().catch(() => false)) ? "idle" : "busy";
      },
      { timeout: 45_000 },
    )
    .not.toBe("busy");
}

export async function waitForOfferMail(request: APIRequestContext, email: string): Promise<string> {
  let html = "";
  await expect
    .poll(
      async () => {
        const emails = await fetchRecordedEmails(request);
        const match = [...emails].reverse().find((e) => e.to.toLowerCase() === email.toLowerCase());
        if (!match) return `pending:${emails.length}`;
        html = match.html;
        return extractMatriculaUrlFromHtml(html) ?? `no-matricula:${match.subject}`;
      },
      { timeout: 30_000 },
    )
    .toMatch(/\/matricula\//i);
  return html;
}

export async function setupProposeOpenSchedule(
  browser: Browser,
  request: APIRequestContext,
): Promise<ProposedSchedule> {
  const lead = newScheduleOfferLead();
  await clearRecordedEmails(request);

  const admin = await browser.newContext({ storageState: paths.storageState });
  const adminPage = await admin.newPage();
  await ensureSectionBOpen(adminPage, lead.locale);
  await ensureTinyHasSeat(adminPage, lead.locale);

  const anon = await browser.newContext();
  const registerPage = await anon.newPage();
  await registerAdultForTiny(registerPage, lead);
  await anon.close();

  const tinyHref = await sectionHrefByName(adminPage, lead.locale, /E2E Section Tiny/i);
  await enrollStudentBIntoHref(adminPage, tinyHref);
  await proposeSectionBForDni(adminPage, lead.locale, lead.dni);
  const offerHtml = await waitForOfferMail(request, lead.email);
  const payUrl = extractMatriculaUrlFromHtml(offerHtml);
  if (!payUrl) throw new Error("offer mail missing /matricula/ href");
  const row = await openAdminRegistrationByDni(adminPage, lead.locale, lead.dni, "offer_pending");
  const expand = row.getByRole("button", { name: /Ver detalle|Show details|Expand|Ver detalhes/i });
  if (await expand.isVisible().catch(() => false)) await expand.click();
  return { ...lead, admin, adminPage, offerHtml, payUrl };
}

export function matriculaPath(payUrl: string): string {
  const base = isolation.ok ? isolation.baseURL : "http://127.0.0.1:3100";
  return new URL(payUrl, base).pathname;
}

import { expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from "@playwright/test";
import { e2eAuthPaths, resolveE2eIsolation } from "../env";
import { extractMatriculaUrlFromHtml } from "./extractMatriculaUrl";
import { clearRecordedEmails, fetchRecordedEmails } from "./recordedEmails";
import { gotoIsolated } from "./gotoIsolated";
import {
  chooseRegisterSectionByName,
  continueRegisterAfterStudent,
  pickRegisterBirthIso,
  submitRegisterAfterDetails,
} from "./registerForm";
import {
  enrollStudentBIntoHref,
  ensureSectionBOpen,
  ensureTinyHasSeat,
  sectionHrefByName,
} from "./scheduleOfferRoster";

export {
  enrollStudentAIntoHref,
  enrollStudentBIntoHref,
  ensureSectionBOpen,
  sectionHrefByName,
} from "./scheduleOfferRoster";

const paths = e2eAuthPaths();
const isolation = resolveE2eIsolation();

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

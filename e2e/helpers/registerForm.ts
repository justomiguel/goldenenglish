import { expect, type Page } from "@playwright/test";

export async function pickRegisterBirthIso(page: Page, isoYmd: string) {
  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoYmd);
  if (!matched) throw new Error(`invalid iso: ${isoYmd}`);
  const year = matched[1];
  const monthIndex = String(Number(matched[2]) - 1);

  await expect(async () => {
    await page.locator("#rg-birth-year").selectOption(year);
    await page.locator("#rg-birth-month").selectOption(monthIndex);
    await expect(page.locator("#rg-birth-year")).toHaveValue(year);
    await expect(page.locator("#rg-birth-month")).toHaveValue(monthIndex);
  }).toPass({ timeout: 30_000 });

  const dayBtn = page.locator(`#rg-birth-calendar-panel td[data-day="${isoYmd}"] button`);
  await expect(dayBtn).toBeVisible({ timeout: 10_000 });
  await dayBtn.click();
  await expect(page.locator('input[name="birth_date"]')).toHaveValue(isoYmd);
}

/** The public form asks for the document before the name fields. */
export async function completeRegisterDniStep(page: Page, dni: string) {
  const firstName = page.locator("#rg-fn");
  if (await firstName.isVisible().catch(() => false)) return;
  const dniInput = page.locator("#rg-dni");
  await expect(dniInput).toBeVisible({ timeout: 20_000 });
  await dniInput.fill(dni);
  await page.locator("form").getByRole("button", { name: /^Continuar$|^Continue$/ }).click();
  await expect(firstName).toBeVisible({ timeout: 30_000 });
}

export async function continueRegisterAfterStudent(page: Page) {
  const next = page.getByRole("button", { name: /^Continuar$|^Continue$/ });
  if (await next.isVisible().catch(() => false)) {
    await next.click();
  }
}

export async function chooseRegisterSectionByName(page: Page, name: string | RegExp) {
  const comboView = page.getByRole("button", {
    name: /clases en lista|classes in list|aulas em lista|^(lista|list)$/i,
  });
  if (await comboView.isVisible().catch(() => false)) {
    await comboView.click();
  }
  const extra = page.locator("#rg-section-extra");
  const primary = page.locator("#rg-section");
  await expect(primary).toBeVisible({ timeout: 15_000 });
  const target = (await extra.isVisible().catch(() => false)) ? extra : primary;
  const option = target.locator("option").filter({ hasText: name }).first();
  await expect(option).toBeAttached({ timeout: 15_000 });
  const value = await option.getAttribute("value");
  if (!value) {
    throw new Error(`section option not found: ${name}`);
  }
  await target.selectOption(value);
}

const SUBMIT_NAME = /enviar solicitud|send request|enviar|submit|inscrib/i;
const TRIAL_SUBMIT_NAME = /agendar clase de prueba|book trial class/i;

async function fillNagoRegisterExtrasIfPresent(page: Page) {
  const nationality = page.locator("#nago-nat");
  if (!(await nationality.isVisible().catch(() => false))) return;
  await nationality.fill("Chile");
  await page.locator("#nago-addr").fill("Calle E2E 100");
  await page.locator("#nago-com").fill("Santiago");
  const school = page.locator("#nago-school");
  if (await school.isVisible().catch(() => false)) {
    await school.fill("Colegio E2E");
  }
  await page.locator("#nago-clinic").fill("CESFAM E2E");
  await page.locator("#nago-em-name").fill("Marta Tutor");
  await page.locator("#nago-em-rel").fill("Madre");
  await page.locator("#nago-em-ph").fill("+5491112345678");
  await page.locator('input[name="nago_protocol_accepted"]').check();
  const signerName = page.locator("#nago-signer-name");
  if (!(await signerName.inputValue()).trim()) {
    await signerName.fill("Marta Tutor");
  }
  const signerDni = page.locator("#nago-signer-dni");
  if (!(await signerDni.inputValue()).trim()) {
    await signerDni.fill("TUTOR-E2E");
  }
}

async function acceptRegisterPrivacyIfPresent(page: Page) {
  const box = page.locator('input[name="privacy_accepted"]');
  if (await box.isVisible().catch(() => false)) {
    await box.check();
  }
}

async function submitNamedRegister(page: Page, name: RegExp) {
  await acceptRegisterPrivacyIfPresent(page);
  const submit = page.getByRole("button", { name });
  if (!(await submit.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /continuar|continue/i }).click();
    await expect(page.locator("#nago-nat")).toBeVisible({ timeout: 15_000 });
    await fillNagoRegisterExtrasIfPresent(page);
  }
  await submit.click();
}

/** Details CTA is Submit on classic tenants, Continue + extras on Nagô. */
export async function submitRegisterAfterDetails(page: Page) {
  await submitNamedRegister(page, SUBMIT_NAME);
}

/** Trial CTA label differs from the reserve submit. */
export async function submitTrialRegisterAfterDetails(page: Page) {
  await submitNamedRegister(page, TRIAL_SUBMIT_NAME);
}

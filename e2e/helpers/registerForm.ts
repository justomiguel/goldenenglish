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

export async function continueRegisterAfterStudent(page: Page) {
  await page.getByRole("button", { name: /continuar|continue|continuar/i }).click();
}

export async function chooseRegisterSectionByName(page: Page, name: string | RegExp) {
  const extra = page.locator("#rg-section-extra");
  const primary = page.locator("#rg-section");
  const target = (await extra.isVisible().catch(() => false)) ? extra : primary;
  const option = target.locator("option").filter({ hasText: name }).first();
  const value = await option.getAttribute("value");
  if (!value) {
    throw new Error(`section option not found: ${name}`);
  }
  await target.selectOption(value);
}

const SUBMIT_NAME = /enviar solicitud|send request|enviar|submit|inscrib/i;

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

/** Details CTA is Submit on classic tenants, Continue + extras on Nagô. */
export async function submitRegisterAfterDetails(page: Page) {
  const submit = page.getByRole("button", { name: SUBMIT_NAME });
  if (!(await submit.isVisible().catch(() => false))) {
    await page.getByRole("button", { name: /continuar|continue/i }).click();
    await expect(page.locator("#nago-nat")).toBeVisible({ timeout: 15_000 });
    await fillNagoRegisterExtrasIfPresent(page);
  }
  await submit.click();
}

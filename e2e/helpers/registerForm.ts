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
  await page.getByRole("checkbox", { name }).check();
}

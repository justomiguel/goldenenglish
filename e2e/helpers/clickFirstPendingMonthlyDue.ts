import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

const PENDING = /(Pago pendiente|Pending payment)/i;
const CURRENT_PENDING =
  /(?:Pago pendiente|Pending payment)[\s\S]*(?:Mes en curso|Current month)|(?:Mes en curso|Current month)[\s\S]*(?:Pago pendiente|Pending payment)/i;

/**
 * Open a due month that shows the receipt field.
 * Prefer the current month so an approval still shows the settled sentence.
 */
export async function clickFirstPendingMonthlyDue(page: Page): Promise<void> {
  const dueCells = page.getByRole("button", { name: PENDING });
  await expect(dueCells.first()).toBeVisible({ timeout: 30_000 });
  const cells: Locator[] = [];
  const current = page.getByRole("button", { name: CURRENT_PENDING });
  if ((await current.count()) > 0) cells.push(current.first());
  const count = await dueCells.count();
  for (let i = 0; i < count; i += 1) cells.push(dueCells.nth(i));
  for (const cell of cells) {
    await cell.click();
    const opened = await page
      .locator('input[name="receipt"]')
      .waitFor({ state: "visible", timeout: 2_000 })
      .then(() => true)
      .catch(() => false);
    if (opened) return;
  }
  throw new Error("pending month did not open a receipt field");
}

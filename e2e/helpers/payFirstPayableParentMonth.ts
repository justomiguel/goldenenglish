import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

const PENDING = /(Pago pendiente|Pending payment)/i;
const CURRENT_PENDING =
  /(?:Pago pendiente|Pending payment)[\s\S]*(?:Mes en curso|Current month)|(?:Mes en curso|Current month)[\s\S]*(?:Pago pendiente|Pending payment)/i;
const BACK = /Volver a pagos|Back to payments/i;

/**
 * Open a pending month whose review page accepts a receipt.
 * Prefer the current month. A future month can stay pending and still have no amount.
 */
export async function payFirstPayableParentMonth(
  page: Page,
  receiptPath: string,
): Promise<void> {
  const pending = page.getByRole("button", { name: PENDING });
  await expect(pending.first()).toBeVisible({ timeout: 30_000 });
  const cells: Locator[] = [];
  const current = page.getByRole("button", { name: CURRENT_PENDING });
  if ((await current.count()) > 0) cells.push(current.first());
  const count = await pending.count();
  for (let i = 0; i < count; i += 1) cells.push(pending.nth(i));
  for (const cell of cells) {
    if (await payCell(page, cell, receiptPath)) return;
  }
  throw new Error("no payable parent month opened a receipt field");
}

async function payCell(page: Page, cell: Locator, receiptPath: string): Promise<boolean> {
  await cell.click();
  const payLink = page.getByRole("link", { name: /Continuar para pagar|Continue to pay/i });
  const linkShown = await payLink
    .waitFor({ state: "visible", timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  if (!linkShown) return false;
  await payLink.click();
  await expect(page).toHaveURL(/\/dashboard\/parent\/payments\/review/, { timeout: 20_000 });
  const receipt = page.locator('input[name="receipt"]');
  const hasReceipt = await receipt
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (!hasReceipt) {
    await page.getByRole("link", { name: BACK }).click();
    await expect(page.getByRole("button", { name: PENDING }).first()).toBeVisible({
      timeout: 20_000,
    });
    return false;
  }
  await receipt.setInputFiles(receiptPath);
  await page.getByRole("button", { name: /Enviar comprobante|Send receipt/i }).click();
  const received = page.getByText(/Comprobante recibido|Receipt uploaded/i).first();
  const sawReceipt = await received
    .waitFor({ state: "visible", timeout: 20_000 })
    .then(() => true)
    .catch(() => false);
  if (sawReceipt) return true;
  await page.getByRole("link", { name: BACK }).click();
  await expect(
    page.getByRole("button", { name: /Comprobante en revisión|under review/i }).first(),
  ).toBeVisible({ timeout: 20_000 });
  return true;
}

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Click the first visible monthly due cell (pending payment).
 * Prefer this over calendar current/next-month labels — the strip only
 * lists months that are actually due; seeded “current month” may already
 * be settled from a prior run.
 *
 * Safe under Playwright `workers: 1` (student then parent consume distinct first dues).
 */
export async function clickFirstPendingMonthlyDue(page: Page): Promise<void> {
  const dueCell = page
    .getByRole("button", {
      name: /(Pago pendiente|Pending payment)/i,
    })
    .first();
  await expect(dueCell).toBeVisible({ timeout: 30_000 });
  await dueCell.click();
}

import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { adminTourSelector, ADMIN_TOUR_ANCHORS } from "../../src/lib/admin-tutorials/selectors";

type ReviewDecision = "approve" | "reject";

/**
 * Admin finance inbox: approve/reject a monthly receipt after client hydration.
 *
 * Cold `next dev` can paint the reject/approve buttons before React attaches
 * handlers; a single click then no-ops. Retries until the Student E2E monthly
 * row leaves the inbox list (not a bare toBeHidden on a stale/wrong `li`).
 */
export async function reviewFinanceInboxMonthlyReceipt(
  page: Page,
  decision: ReviewDecision,
  studentName = /Student\s+E2E/i,
): Promise<void> {
  await expect(page.locator(adminTourSelector(ADMIN_TOUR_ANCHORS.financeInboxRoot))).toBeVisible({
    timeout: 30_000,
  });

  const tourAttr =
    decision === "approve"
      ? ADMIN_TOUR_ANCHORS.financeInboxApprove
      : ADMIN_TOUR_ANCHORS.financeInboxReject;
  const nameRe =
    decision === "approve" ? /OK — Pagado|OK — Paid/i : /Rechazado|Rejected/i;

  const monthlyRows = page
    .locator("ul")
    .filter({ has: page.locator(`[data-tour="${tourAttr}"]`) })
    .locator("li.list-none")
    .filter({ hasText: studentName });

  await expect(monthlyRows.first()).toBeVisible({ timeout: 30_000 });
  const before = await monthlyRows.count();

  await expect(async () => {
    const row = monthlyRows.first();
    await expect(row).toBeVisible({ timeout: 3_000 });
    const btn = row
      .getByRole("button", { name: nameRe })
      .or(row.locator(`[data-tour="${tourAttr}"]`))
      .first();
    await expect(btn).toBeEnabled({ timeout: 3_000 });
    await btn.click();
    await expect
      .poll(async () => monthlyRows.count(), { timeout: 12_000 })
      .toBeLessThan(before);
  }).toPass({ timeout: 60_000 });
}

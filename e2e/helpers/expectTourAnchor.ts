import { expect, type Page } from "@playwright/test";
import { adminTourSelector, type AdminTourAnchor } from "../../src/lib/admin-tutorials/selectors";

/** Reusable for any future full-app E2E spec that asserts tour / UI anchors. */
export async function expectTourAnchorVisible(
  page: Page,
  anchor: AdminTourAnchor,
  label?: string,
): Promise<void> {
  await expect(
    page.locator(adminTourSelector(anchor)).first(),
    label ?? `data-tour="${anchor}"`,
  ).toBeVisible({ timeout: 15_000 });
}

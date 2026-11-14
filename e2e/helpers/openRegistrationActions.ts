import { expect, type Locator } from "@playwright/test";

const ACTIONS_NAME = /^Acciones$|^Actions$/;
const MARK_CONTACTED_NAME = /^Marcar contactado$|^Mark contacted$|^Marcar contatado$/;

/** The row only shows Acciones. Mark contacted lives in that dialog. */
export async function markRegistrationContactedFromRow(row: Locator): Promise<void> {
  await row.getByRole("button", { name: ACTIONS_NAME }).click();
  const dialog = row.page().getByRole("dialog");
  await expect(dialog).toBeVisible({ timeout: 15_000 });
  await dialog.getByRole("button", { name: MARK_CONTACTED_NAME }).click();
  await expect(row).toBeHidden({ timeout: 60_000 });
}

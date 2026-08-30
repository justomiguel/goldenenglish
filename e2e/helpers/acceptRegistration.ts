import type { Locator } from "@playwright/test";

/** Accept dialog requires an explicit join-billing disposition. */
export async function chooseJoinBillingCurrent(dialog: Locator) {
  await dialog.getByRole("radio", { name: /^(Al día|Current \(|Em dia)/ }).check();
}

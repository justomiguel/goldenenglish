/** Task 8 wires branded mail. Failed send must not roll back checkout. */
export async function notifyShopEmail(_input: {
  to: string;
  key: "shop.guest_account_created" | "shop.order_started" | "shop.order_paid" | "shop.order_ready";
  vars?: Record<string, string>;
}): Promise<void> {
  return undefined;
}

export type ShopOrderStatus =
  | "pending_payment"
  | "paid"
  | "ready_for_pickup"
  | "picked_up"
  | "expired"
  | "cancelled";

export type ShopAssignActorRole = "admin" | "parent" | "student";

export type GuestShopperProfile = {
  first_name: string;
  last_name: string;
  dni_or_passport: string;
  role: "parent";
};

export type ShopLineInput = {
  quantity: number;
  unitPrice: number;
};

export type CanAssignShopOrderInput = {
  actorRole: ShopAssignActorRole;
  buyerId: string;
  actorId: string;
  childIds: readonly string[];
  studentId: string;
};

export type ShopCheckoutGateway = "flow" | "mercadopago";

export type ShopCheckoutLine = {
  variantId: string;
  quantity: number;
};

export type ShopCheckoutFailCode =
  | "flag_off"
  | "empty_cart"
  | "insufficient_stock"
  | "inactive_variant"
  | "no_gateway"
  | "student_forbidden";

export type StartShopCheckoutResult =
  | { ok: true; redirectUrl: string; payToken: string }
  | { ok: false; code: ShopCheckoutFailCode };

export type EnsureGuestShopperParentResult =
  | { kind: "created"; profileId: string; tempPassword: string }
  | { kind: "existing_parent"; profileId: string }
  | { kind: "wrong_role" };

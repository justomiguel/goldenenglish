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

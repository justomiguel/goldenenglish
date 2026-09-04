import type { ShopCheckoutFailCode } from "@/lib/shop/types";

export function shopCheckoutBuyerFailCode(role: string): ShopCheckoutFailCode | null {
  if (role === "parent") return null;
  if (role === "student") return "student_forbidden";
  return "wrong_role";
}

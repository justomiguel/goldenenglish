import type { GuestShopperProfile } from "@/lib/shop/types";

const GUEST_LAST_NAME = "Tienda";
const GUEST_FIRST_NAME_FALLBACK = "Invitado";

function emailLocalPart(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "";
  return email.slice(0, at).trim();
}

export function buildGuestShopperProfile(email: string, id: string): GuestShopperProfile {
  const localPart = emailLocalPart(email);
  return {
    first_name: localPart || GUEST_FIRST_NAME_FALLBACK,
    last_name: GUEST_LAST_NAME,
    dni_or_passport: `shop:${id}`,
    role: "parent",
  };
}

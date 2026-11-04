import {
  emailHref,
  instagramUrl,
  normalizeAddress,
  normalizePhone,
  phoneHref,
  whatsappUrl,
} from "@/lib/pulsar/freeSiteShare";

export type GenericSiteContactInput = {
  email: string;
  phone: string;
  address: string;
  whatsapp: string;
  instagram: string;
};

export type GenericSiteContactPatchResult =
  | { ok: true; patch: Record<string, string> }
  | { ok: false; errorCode: "email" | "phone" | "whatsapp" | "instagram" };

/** Values the public page can render. A blank field clears that key. */
export function genericSiteContactPatch(input: GenericSiteContactInput): GenericSiteContactPatchResult {
  const email = input.email.trim();
  const phone = normalizePhone(input.phone);
  const address = normalizeAddress(input.address);
  const whatsappRaw = input.whatsapp.trim();
  const instagramRaw = input.instagram.trim();
  if (email && !emailHref(email)) return { ok: false, errorCode: "email" };
  if (phone && !phoneHref(phone)) return { ok: false, errorCode: "phone" };
  const whatsapp = whatsappRaw ? whatsappUrl(whatsappRaw) : "";
  if (whatsappRaw && !whatsapp) return { ok: false, errorCode: "whatsapp" };
  const instagram = instagramRaw ? instagramUrl(instagramRaw) : "";
  if (instagramRaw && !instagram) return { ok: false, errorCode: "instagram" };
  return {
    ok: true,
    patch: {
      "contact.email": email,
      "contact.phone": phone,
      "contact.address": address,
      "social.whatsapp": whatsapp ?? "",
      "social.instagram": instagram ?? "",
    },
  };
}

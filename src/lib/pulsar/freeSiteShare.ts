const MAX_PHONE = 40;
const MAX_ADDRESS = 180;
const MAX_SOCIAL = 200;
const MAX_NAME = 80;

export function normalizePhone(raw: string): string {
  return raw.trim().slice(0, MAX_PHONE);
}

export function normalizeAddress(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_ADDRESS);
}

export function phoneHref(raw: string): string | null {
  const trimmed = normalizePhone(raw);
  if (!/^[+0-9()\-\s]{3,40}$/.test(trimmed)) return null;
  return `tel:${trimmed.replace(/\s/g, "")}`;
}

export function emailHref(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  return `mailto:${trimmed}`;
}

/** A WhatsApp number or an existing wa.me link. Other URLs are dropped. */
export function whatsappUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\/(www\.)?wa\.me\/\d{8,15}\/?$/i.test(trimmed)) return trimmed.slice(0, MAX_SOCIAL);
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  return `https://wa.me/${digits}`;
}

/** An Instagram handle or an instagram.com link. */
export function instagramUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/i.test(trimmed)) {
    return trimmed.slice(0, MAX_SOCIAL);
  }
  const handle = trimmed.replace(/^@/, "");
  if (/^[A-Za-z0-9._]{1,30}$/.test(handle)) return `https://instagram.com/${handle}`;
  return null;
}

/** A Facebook handle or a facebook.com link. */
export function facebookUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\/(www\.)?facebook\.com\/[A-Za-z0-9.\-_]{1,50}\/?$/i.test(trimmed)) {
    return trimmed.slice(0, MAX_SOCIAL);
  }
  const handle = trimmed.replace(/^@/, "");
  if (/^[A-Za-z0-9.\-_]{1,50}$/.test(handle)) return `https://facebook.com/${handle}`;
  return null;
}

export function googleMapEmbedUrl(address: string): string | null {
  const query = normalizeAddress(address);
  if (!query) return null;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;
}

export function freeSiteShareProperties(input: {
  email: string;
  phone: string;
  whatsapp: string;
  instagram: string;
  facebook: string;
  address: string;
  displayName: string;
}): Record<string, string> {
  const out: Record<string, string> = {};
  const email = input.email.trim();
  if (email.includes("@")) out["contact.email"] = email;
  const phone = normalizePhone(input.phone);
  if (phone) out["contact.phone"] = phone;
  const address = normalizeAddress(input.address);
  if (address) out["contact.address"] = address;
  const whatsapp = whatsappUrl(input.whatsapp);
  if (whatsapp) out["social.whatsapp"] = whatsapp;
  const instagram = instagramUrl(input.instagram);
  if (instagram) out["social.instagram"] = instagram;
  const facebook = facebookUrl(input.facebook);
  if (facebook) out["social.facebook"] = facebook;
  const name = input.displayName.trim().slice(0, MAX_NAME);
  if (name) {
    out["app.name"] = name;
    out["app.legal.name"] = name;
    out["app.logo.alt"] = name;
  }
  return out;
}

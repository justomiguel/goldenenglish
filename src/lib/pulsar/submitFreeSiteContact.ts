import { z } from "zod";
import { getDictionary, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { logServerWarn } from "@/lib/logging/serverActionLog";
import { loadFreeSiteOwnerEmail, releaseFreeContactMail, reserveFreeContactMail } from "@/lib/pulsar/freeContactMail";
import { saveFreeSiteMessage } from "@/lib/pulsar/freeSiteMessages";
import { sendPulsarMail } from "@/lib/pulsar/pulsarMail";
import { pulsarMailMessage } from "@/lib/pulsar/pulsarMailMessage";
import { getAlsTenant } from "@/lib/tenant/alsTenantAccessor";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import type { Locale } from "@/types/i18n";

const schema = z.object({
  locale: z.string(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  message: z.string().trim().min(1).max(4000),
});

export type FreeSiteContactResult =
  | { ok: true }
  | { ok: false; errorCode: "preview" | "invalid" | "quota" | "persist" | "unavailable" };

function mailLocale(value: string): Locale {
  return (locales.includes(value as AppLocale) ? value : "es") as Locale;
}

/** Sends one visitor message to the free-site owner. The preview route sends nothing. */
export async function submitFreeSiteContact(input: unknown): Promise<FreeSiteContactResult> {
  if (await isPulsarPlatformRequest()) return { ok: false, errorCode: "preview" };
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, errorCode: "invalid" };
  const slug = getAlsTenant()?.slug?.trim() ?? "";
  if (!slug) return { ok: false, errorCode: "unavailable" };

  const reserve = await reserveFreeContactMail(slug);
  if (reserve === "quota") return { ok: false, errorCode: "quota" };
  if (reserve !== "reserved") {
    logServerWarn("freeSiteContact:reserve", { slug, code: reserve });
    return { ok: false, errorCode: "unavailable" };
  }

  const ownerEmail = await loadFreeSiteOwnerEmail(slug);
  if (!ownerEmail) {
    await releaseFreeContactMail(slug);
    logServerWarn("freeSiteContact:owner", { slug, code: "missing_owner" });
    return { ok: false, errorCode: "unavailable" };
  }

  const saved = await saveFreeSiteMessage({
    slug,
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    body: parsed.data.message,
  });
  if (!saved) {
    await releaseFreeContactMail(slug);
    return { ok: false, errorCode: "persist" };
  }

  const dict = await getDictionary(parsed.data.locale);
  const draft = pulsarMailMessage({
    to: ownerEmail,
    locale: mailLocale(parsed.data.locale),
    brandName: slug,
    subject: dict.landing.genericContact.mailSubject,
    body: "{name}<br />{email}<br />{phone}<br /><br />{text}",
    vars: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      text: parsed.data.message.replace(/\s+/g, " "),
    },
  });
  if (!draft) {
    await releaseFreeContactMail(slug);
    logServerWarn("freeSiteContact:draft", { slug, code: "missing_draft" });
    return { ok: true };
  }
  const sent = await sendPulsarMail([draft]);
  if (!sent.ok) {
    logServerWarn("freeSiteContact:send", { slug, code: sent.errorCode });
  }
  return { ok: true };
}

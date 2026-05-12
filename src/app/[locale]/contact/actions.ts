"use server";

import { z } from "zod";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createAdminClient } from "@/lib/supabase/admin";
import { deliverPublicSiteContactToAdmins } from "@/lib/messaging/deliverPublicSiteContactToAdmins";
import { publicSiteContactSubjectSchema } from "@/lib/messaging/publicSiteContactSubjects";
import { logServerException } from "@/lib/logging/serverActionLog";

const formSchema = z.object({
  fullName: z.string().trim().min(1, "name").max(200),
  email: z.string().trim().min(1, "email").max(320).email(),
  phone: z
    .string()
    .trim()
    .max(40)
    .transform((s) => (s.length === 0 ? null : s)),
  subject: publicSiteContactSubjectSchema,
  body: z.string().trim().min(1, "body").max(8000),
});

export type SubmitPublicContactPayload = z.input<typeof formSchema>;

export async function submitPublicContactForm(
  locale: string,
  payload: SubmitPublicContactPayload,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const dict = await getDictionary(locale);
  const err = dict.publicContact.errors;

  const parsed = formSchema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, message: err.invalid };
  }

  const { fullName, email, phone, subject, body } = parsed.data;

  const subjectLabel =
    subject === "classes"
      ? dict.publicContact.subjectClasses
      : subject === "prices"
        ? dict.publicContact.subjectPrices
        : subject === "modalities"
          ? dict.publicContact.subjectModalities
          : dict.publicContact.subjectOther;

  const metaLines = [
    { label: dict.publicContact.fullName, value: fullName },
    { label: dict.publicContact.email, value: email },
    { label: dict.publicContact.phone, value: phone ?? "" },
  ];

  try {
    const admin = createAdminClient();
    const result = await deliverPublicSiteContactToAdmins(admin, {
      locale,
      subjectFieldLabel: dict.publicContact.subject,
      subjectLabel,
      metaLines,
      bodyPlain: body,
      senderDisplayName: `${fullName} (${dict.publicContact.title})`,
      visitorReplyEmail: email,
    });

    if (!result.ok) {
      if (result.code === "no_admins") {
        return { ok: false, message: err.noStaff };
      }
      return { ok: false, message: err.persist };
    }
    return { ok: true };
  } catch (e) {
    logServerException("submitPublicContactForm", e, { scope: "publicContact" });
    return { ok: false, message: err.persist };
  }
}

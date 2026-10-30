import "server-only";

import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { loadPulsarMailSettings, sendPulsarMail } from "@/lib/pulsar/pulsarMail";
import { pulsarMailMessage, type PulsarMailDraft } from "@/lib/pulsar/pulsarMailMessage";

function localeOf(locale: string): AppLocale {
  if (locale === "en" || locale === "pt") return locale;
  return "es";
}

async function deliver(drafts: Array<PulsarMailDraft | null>): Promise<void> {
  await sendPulsarMail(drafts.filter((draft): draft is PulsarMailDraft => draft !== null));
}

async function mailCopy(locale: string) {
  const loc = localeOf(locale);
  const dict = await getDictionary(loc);
  return { locale: loc, brandName: dict.pulsar.meta.brandName, copy: dict.pulsar.mail };
}

export async function mailOwnerRequested(email: string, locale: string): Promise<void> {
  const { copy, locale: loc, brandName } = await mailCopy(locale);
  const settings = await loadPulsarMailSettings();
  const vars = { email };
  await deliver([
    pulsarMailMessage({
      to: settings.notifyEmail,
      subject: copy.requestedAdminSubject,
      body: copy.requestedAdminBody,
      vars,
      locale: loc,
      brandName,
    }),
    pulsarMailMessage({
      to: email,
      subject: copy.requestedUserSubject,
      body: copy.requestedUserBody,
      vars,
      locale: loc,
      brandName,
    }),
  ]);
}

export async function mailOwnerDecision(
  email: string,
  locale: string,
  decision: "approved" | "rejected",
): Promise<void> {
  const { copy, locale: loc, brandName } = await mailCopy(locale);
  const approved = decision === "approved";
  await deliver([
    pulsarMailMessage({
      to: email,
      subject: approved ? copy.approvedSubject : copy.rejectedSubject,
      body: approved ? copy.approvedBody : copy.rejectedBody,
      vars: { email },
      locale: loc,
      brandName,
    }),
  ]);
}

export async function mailSiteCreated(input: {
  email: string;
  locale: string;
  name: string;
  slug: string;
}): Promise<void> {
  const { copy, locale: loc, brandName } = await mailCopy(input.locale);
  const settings = await loadPulsarMailSettings();
  const vars = { email: input.email, name: input.name, slug: input.slug };
  await deliver([
    pulsarMailMessage({
      to: input.email,
      subject: copy.siteSubject,
      body: copy.siteBody,
      vars,
      locale: loc,
      brandName,
    }),
    pulsarMailMessage({
      to: settings.notifyEmail,
      subject: copy.siteAdminSubject,
      body: copy.siteAdminBody,
      vars,
      locale: loc,
      brandName,
    }),
  ]);
}

import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { PulsarAccountFrame } from "@/components/organisms/pulsar/PulsarAccountFrame";
import { getDictionary, defaultLocale, locales, type AppLocale } from "@/lib/i18n/dictionaries";
import { GE_REQUEST_LOCALE_HEADER } from "@/lib/i18n/requestLocaleHeader";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const metadata = { robots: { index: false, follow: false } };

export default async function PulsarAccountLayout({ children }: { children: React.ReactNode }) {
  if (!(await isPulsarPlatformRequest())) notFound();
  const headerStore = await headers();
  const headerLocale = headerStore.get(GE_REQUEST_LOCALE_HEADER);
  const locale: AppLocale =
    headerLocale && (locales as readonly string[]).includes(headerLocale)
      ? (headerLocale as AppLocale)
      : defaultLocale;
  const [dict, session] = await Promise.all([
    getDictionary(locale),
    getPulsarCookieSession(),
  ]);
  return (
    <PulsarAccountFrame locale={locale} dict={dict} email={session?.email ?? null}>
      {children}
    </PulsarAccountFrame>
  );
}

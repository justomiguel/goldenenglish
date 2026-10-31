import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarContactoView } from "@/components/organisms/pulsar/PulsarContactoView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!(await isPulsarPlatformRequest())) return {};
  const { locale } = await params;
  const dict = await getDictionary(locale as AppLocale);
  const share = await centrolistoShareMetadata({
    title: dict.pulsar.meta.contactoTitle,
    description: dict.pulsar.meta.contactoDescription,
    siteName: dict.pulsar.meta.brandName,
    locale,
    suffix: "/contacto",
  });
  return {
    title: dict.pulsar.meta.contactoTitle,
    description: dict.pulsar.meta.contactoDescription,
    ...share,
  };
}

export default async function PulsarContactoPage({ params }: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale } = await params;
  const [dict, session] = await Promise.all([
    getDictionary(locale as AppLocale),
    getPulsarCookieSession(),
  ]);
  return <PulsarContactoView locale={locale} dict={dict} email={session?.email ?? null} />;
}

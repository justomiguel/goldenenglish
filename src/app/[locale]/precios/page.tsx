import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PulsarPricingView } from "@/components/organisms/pulsar/PulsarPricingView";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!(await isPulsarPlatformRequest())) return {};
  const { locale } = await params;
  const dict = await getDictionary(locale as AppLocale);
  const copy = dict.pulsar.pricing;
  const share = await centrolistoShareMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    siteName: dict.pulsar.meta.brandName,
    locale,
    suffix: "/precios",
  });
  return {
    title: { absolute: copy.seoTitle },
    description: copy.seoDescription,
    ...share,
  };
}

export default async function PulsarPricingPage({ params }: PageProps) {
  if (!(await isPulsarPlatformRequest())) notFound();
  const { locale } = await params;
  const [dict, session] = await Promise.all([
    getDictionary(locale as AppLocale),
    getPulsarCookieSession(),
  ]);
  return <PulsarPricingView locale={locale} dict={dict} email={session?.email ?? null} />;
}

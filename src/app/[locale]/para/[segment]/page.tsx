import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PulsarSegmentView } from "@/components/organisms/pulsar/PulsarSegmentView";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { isPulsarSegmentSlug } from "@/lib/pulsar/pulsarSegmentSlugs";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { readCentrolistoMarket } from "@/lib/pulsar/readCentrolistoMarket";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; segment: string }>;
  searchParams: Promise<{ pais?: string | string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!(await isPulsarPlatformRequest())) return {};
  const { locale, segment } = await params;
  if (!isPulsarSegmentSlug(segment)) return {};
  const dict = await getDictionary(locale as AppLocale);
  const copy = dict.pulsar.segments[segment];
  const share = await centrolistoShareMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    siteName: dict.pulsar.meta.brandName,
    locale,
    suffix: `/para/${segment}`,
  });
  return {
    title: { absolute: copy.seoTitle },
    description: copy.seoDescription,
    ...share,
  };
}

export default async function PulsarSegmentPage({ params, searchParams }: PageProps) {
  if (!(await isPulsarPlatformRequest())) notFound();
  const { locale, segment } = await params;
  if (!isPulsarSegmentSlug(segment)) notFound();
  const [dict, session, market] = await Promise.all([
    getDictionary(locale as AppLocale),
    getPulsarCookieSession(),
    readCentrolistoMarket(await searchParams),
  ]);
  return (
    <PulsarSegmentView
      locale={locale}
      dict={dict}
      segment={segment}
      email={session?.email ?? null}
      market={market}
    />
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PulsarSegmentView } from "@/components/organisms/pulsar/PulsarSegmentView";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { isPulsarSegmentSlug } from "@/lib/pulsar/pulsarSegmentSlugs";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; segment: string }>;
  searchParams: Promise<{ pais?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  if (!(await isPulsarPlatformRequest())) return {};
  const { locale, segment } = await params;
  if (!isPulsarSegmentSlug(segment)) return {};
  const { dict } = await loadCentrolistoDictionary(locale, await searchParams);
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
  const query = await searchParams;
  const [loaded, session] = await Promise.all([
    loadCentrolistoDictionary(locale, query),
    getPulsarCookieSession(),
  ]);
  return (
    <PulsarSegmentView
      locale={locale}
      dict={loaded.dict}
      segment={segment}
      email={session?.email ?? null}
      market={loaded.market}
    />
  );
}

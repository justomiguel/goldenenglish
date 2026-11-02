import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PulsarPricingView } from "@/components/organisms/pulsar/PulsarPricingView";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pais?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  if (!(await isPulsarPlatformRequest())) return {};
  const { locale } = await params;
  const { dict } = await loadCentrolistoDictionary(locale, await searchParams);
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

export default async function PulsarPricingPage({ params, searchParams }: PageProps) {
  if (!(await isPulsarPlatformRequest())) notFound();
  const { locale } = await params;
  const query = await searchParams;
  const [loaded, session] = await Promise.all([
    loadCentrolistoDictionary(locale, query),
    getPulsarCookieSession(),
  ]);
  return (
    <PulsarPricingView
      locale={locale}
      dict={loaded.dict}
      email={session?.email ?? null}
      market={loaded.market}
    />
  );
}

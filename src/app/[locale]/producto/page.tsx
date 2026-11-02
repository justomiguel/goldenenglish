import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarProductoView } from "@/components/organisms/pulsar/PulsarProductoView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pais?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  if (!(await isPulsarPlatformRequest())) return {};
  const { locale } = await params;
  const { dict } = await loadCentrolistoDictionary(locale, await searchParams);
  const share = await centrolistoShareMetadata({
    title: dict.pulsar.meta.productoTitle,
    description: dict.pulsar.meta.productoDescription,
    siteName: dict.pulsar.meta.brandName,
    locale,
    suffix: "/producto",
  });
  return {
    title: dict.pulsar.meta.productoTitle,
    description: dict.pulsar.meta.productoDescription,
    ...share,
  };
}

export default async function PulsarProductoPage({ params, searchParams }: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale } = await params;
  const query = await searchParams;
  const [loaded, session] = await Promise.all([
    loadCentrolistoDictionary(locale, query),
    getPulsarCookieSession(),
  ]);
  return (
    <PulsarProductoView
      locale={locale}
      dict={loaded.dict}
      email={session?.email ?? null}
      market={loaded.market}
    />
  );
}

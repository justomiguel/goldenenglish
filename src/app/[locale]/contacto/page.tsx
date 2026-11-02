import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarContactoView } from "@/components/organisms/pulsar/PulsarContactoView";

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

export default async function PulsarContactoPage({ params, searchParams }: PageProps) {
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
    <PulsarContactoView
      locale={locale}
      dict={loaded.dict}
      email={session?.email ?? null}
      market={loaded.market}
    />
  );
}

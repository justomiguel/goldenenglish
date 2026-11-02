import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { attachClientPreviewMedia } from "@/lib/pulsar/centrolistoClientPreviews";
import { loadAllPulsarTenantsForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarClientesView } from "@/components/organisms/pulsar/PulsarClientesView";

function publicAssetExists(publicPath: string): boolean {
  return existsSync(join(process.cwd(), "public", publicPath.replace(/^\//, "")));
}

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
    title: dict.pulsar.meta.clientesTitle,
    description: dict.pulsar.meta.clientesDescription,
    siteName: dict.pulsar.meta.brandName,
    locale,
    suffix: "/clientes",
  });
  return {
    title: dict.pulsar.meta.clientesTitle,
    description: dict.pulsar.meta.clientesDescription,
    ...share,
  };
}

export default async function PulsarClientesPage({ params, searchParams }: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale } = await params;
  const query = await searchParams;
  const [loaded, tenants, session] = await Promise.all([
    loadCentrolistoDictionary(locale, query),
    loadAllPulsarTenantsForAdmin(),
    getPulsarCookieSession(),
  ]);
  const clients = attachClientPreviewMedia(
    tenants
      .filter((t) => t.isEnabled)
      .map((t) => ({
        slug: t.slug,
        displayName: t.displayName,
        hosts: t.hosts,
        publicUrl: t.publicUrl,
      })),
    publicAssetExists,
  );
  return (
    <PulsarClientesView locale={locale} dict={loaded.dict} clients={clients} email={session?.email ?? null} market={loaded.market} />
  );
}

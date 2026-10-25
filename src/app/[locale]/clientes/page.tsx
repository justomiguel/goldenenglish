import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { loadAllPulsarTenantsForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarClientesView } from "@/components/organisms/pulsar/PulsarClientesView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!(await isPulsarPlatformRequest())) return {};
  const { locale } = await params;
  const dict = await getDictionary(locale as AppLocale);
  return {
    title: dict.pulsar.meta.clientesTitle,
    description: dict.pulsar.meta.description,
  };
}

export default async function PulsarClientesPage({ params }: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale } = await params;
  const [dict, tenants] = await Promise.all([
    getDictionary(locale as AppLocale),
    loadAllPulsarTenantsForAdmin(),
  ]);
  const clients = tenants
    .filter((t) => t.isEnabled)
    .map((t) => ({
      slug: t.slug,
      displayName: t.displayName,
      hosts: t.hosts,
      publicUrl: t.publicUrl,
    }));
  return <PulsarClientesView locale={locale} dict={dict} clients={clients} />;
}

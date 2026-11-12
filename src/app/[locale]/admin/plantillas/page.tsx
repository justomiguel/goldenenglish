import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PulsarAdminChrome } from "@/components/organisms/pulsar/PulsarAdminChrome";
import { PulsarTemplateCatalog } from "@/components/organisms/pulsar/PulsarTemplateCatalog";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { centrolistoPrivatePageMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { buildPulsarTemplateCatalogCards } from "@/lib/pulsar/pulsarTemplateCatalog";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale as AppLocale);
  return centrolistoPrivatePageMetadata({
    locale,
    title: dict.pulsar.admin.templatesTitle,
    description: dict.pulsar.admin.templatesLead,
    siteName: dict.pulsar.meta.brandName,
    suffix: "/admin/plantillas",
  });
}

export default async function PulsarAdminTemplateCatalogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!(await isPulsarPlatformRequest())) notFound();
  const { locale } = await params;
  const session = await getPulsarStaffSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (session.mustChangePassword) redirect(`/${locale}/admin/password`);
  const dict = await getDictionary(locale as AppLocale);
  const cards = buildPulsarTemplateCatalogCards({
    locale,
    names: dict.pulsar.solutionSet.presencia.templateKinds,
    openLabel: dict.pulsar.admin.templatesOpen,
    applyLabel: dict.pulsar.admin.templatesApply,
  });
  return (
    <PulsarAdminChrome locale={locale} dict={dict} email={session.email}>
      <PulsarTemplateCatalog
        title={dict.pulsar.admin.templatesTitle}
        lead={dict.pulsar.admin.templatesLead}
        cards={cards}
      />
    </PulsarAdminChrome>
  );
}

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PulsarTemplateCatalog } from "@/components/organisms/pulsar/PulsarTemplateCatalog";
import { centrolistoPrivatePageMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { loadPulsarOwnerHome } from "@/lib/pulsar/pulsarOwnerAccount";
import { buildPulsarTemplateCatalogCards } from "@/lib/pulsar/pulsarTemplateCatalog";
import {
  createPulsarAdminClient,
  createPulsarServerClient,
  isPulsarSupabaseConfigured,
} from "@/lib/supabase/pulsar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { dict } = await loadCentrolistoDictionary(locale, {});
  return centrolistoPrivatePageMetadata({
    locale,
    title: dict.pulsar.admin.templatesTitle,
    description: dict.pulsar.admin.templatesLead,
    siteName: dict.pulsar.meta.brandName,
    suffix: "/cuenta/plantillas",
  });
}

export default async function PulsarAccountTemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPulsarSupabaseConfigured()) redirect(`/${locale}/cuenta/login`);
  const server = await createPulsarServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) redirect(`/${locale}/cuenta/login`);

  const admin = createPulsarAdminClient();
  const { data: staff } = await admin
    .from("platform_staff")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (staff) redirect(`/${locale}/admin/plantillas`);

  const home = await loadPulsarOwnerHome(user.id);
  if (home.kind !== "owner") redirect(`/${locale}/cuenta/nuevo`);
  const { dict } = await loadCentrolistoDictionary(locale, {});
  const cards = buildPulsarTemplateCatalogCards({
    locale,
    names: dict.pulsar.solutionSet.presencia.templateKinds,
    openLabel: dict.pulsar.admin.templatesOpen,
  });

  return (
    <PulsarTemplateCatalog
      title={dict.pulsar.admin.templatesTitle}
      lead={dict.pulsar.admin.templatesLead}
      cards={cards}
    />
  );
}

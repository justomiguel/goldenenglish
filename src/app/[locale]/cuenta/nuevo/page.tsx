import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { centrolistoPrivatePageMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { PulsarAccountCreateForm } from "@/components/organisms/pulsar/PulsarAccountCreateForm";
import { ensureOwnerForExistingLogin, loadPulsarOwnerHome } from "@/lib/pulsar/pulsarOwnerAccount";
import { canCreateFreeSite } from "@/lib/pulsar/freeSitePlan";
import { signedInCanOpenCreateForm } from "@/lib/pulsar/pulsarStartPath";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";
import {
  createPulsarServerClient,
  isPulsarSupabaseConfigured,
} from "@/lib/supabase/pulsar";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pais?: string | string[] }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { dict } = await loadCentrolistoDictionary(locale, await searchParams);
  return centrolistoPrivatePageMetadata({
    locale,
    title: dict.pulsar.account.createTitle,
    description: dict.pulsar.account.createLead,
    siteName: dict.pulsar.meta.brandName,
    suffix: "/cuenta/nuevo",
  });
}

export default async function PulsarAccountNewSitePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pais?: string | string[] }>;
}) {
  const { locale } = await params;
  if (!isPulsarSupabaseConfigured()) redirect(`/${locale}/cuenta/login`);
  const server = await createPulsarServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) redirect(`/${locale}/cuenta/login`);
  let home = await loadPulsarOwnerHome(user.id);
  const status = home.kind === "owner" ? home.status : "missing";
  const ownedCount = home.kind === "owner" ? home.ownedCount : 0;
  if (!signedInCanOpenCreateForm({ status, ownedCount })) redirect(`/${locale}/cuenta`);
  if (home.kind !== "owner") {
    home = await ensureOwnerForExistingLogin({ userId: user.id, email: user.email ?? "" });
  }
  if (home.kind !== "owner" || home.status === "rejected" || !canCreateFreeSite(home.ownedCount)) {
    redirect(home.kind === "owner" ? `/${locale}/cuenta` : `/${locale}`);
  }
  const { dict } = await loadCentrolistoDictionary(locale, await searchParams);
  const previews = GENERIC_INSTITUTE_KINDS.map((kind) => {
    const landing = dict.landing.genericLandings[kind];
    return {
      kind,
      name: landing.name,
      alt: dict.pulsar.account.templatePreviewAlt.replaceAll("{name}", landing.name),
      src: `/generic/${kind}/preview.jpg`,
    };
  });
  const pageLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: dict.pulsar.account.createTitle,
    description: dict.pulsar.account.createLead,
    inLanguage: locale,
    isPartOf: { "@type": "WebSite", name: dict.pulsar.meta.brandName },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageLd) }} />
      <PulsarAccountCreateForm
        locale={locale}
        copy={dict.pulsar.account}
        brandName={dict.pulsar.meta.brandName}
        previews={previews}
      />
    </>
  );
}

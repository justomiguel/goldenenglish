import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PulsarAccountAuthScreen } from "@/components/organisms/pulsar/PulsarAccountAuthScreen";
import { withCentrolistoMarket } from "@/lib/pulsar/centrolistoMarket";
import { centrolistoPrivatePageMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { readCentrolistoMarket } from "@/lib/pulsar/readCentrolistoMarket";
import { pulsarStartFreePath } from "@/lib/pulsar/pulsarStartPath";
import { createPulsarServerClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

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
    title: dict.pulsar.account.registerTitle,
    description: dict.pulsar.account.registerLead,
    siteName: dict.pulsar.meta.brandName,
    suffix: "/cuenta/registro",
  });
}

export default async function PulsarAccountRegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ pais?: string | string[] }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  if (isPulsarSupabaseConfigured()) {
    const server = await createPulsarServerClient();
    const {
      data: { user },
    } = await server.auth.getUser();
    if (user) {
      const market = await readCentrolistoMarket(query);
      redirect(withCentrolistoMarket(pulsarStartFreePath(locale, true), market));
    }
  }
  const { dict, market } = await loadCentrolistoDictionary(locale, query);
  return (
    <PulsarAccountAuthScreen
      locale={locale}
      dict={dict}
      market={market}
      mode="register"
      copy={dict.pulsar.account}
      nextPath={`/${locale}/cuenta`}
    />
  );
}

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { resolvePulsarPostLoginPath } from "@/app/[locale]/admin/sessionActions";
import { centrolistoPrivatePageMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { PulsarAccountAuthScreen } from "@/components/organisms/pulsar/PulsarAccountAuthScreen";
import { safePulsarNext } from "@/lib/pulsar/safePulsarNext";

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; pais?: string | string[] }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { dict } = await loadCentrolistoDictionary(locale, await searchParams);
  return centrolistoPrivatePageMetadata({
    locale,
    title: dict.pulsar.account.loginTitle,
    description: dict.pulsar.account.loginLead,
    siteName: dict.pulsar.meta.brandName,
    suffix: "/cuenta/login",
  });
}

export default async function PulsarAccountLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; pais?: string | string[] }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const nextPath = safePulsarNext(locale, query.next) ?? `/${locale}/cuenta`;
  const destination = await resolvePulsarPostLoginPath(locale, query.next ?? null);
  if (!destination.endsWith("/cuenta/login")) redirect(destination);
  const { dict, market } = await loadCentrolistoDictionary(locale, query);
  return (
    <PulsarAccountAuthScreen
      locale={locale}
      dict={dict}
      market={market}
      mode="login"
      copy={dict.pulsar.account}
      nextPath={nextPath}
    />
  );
}

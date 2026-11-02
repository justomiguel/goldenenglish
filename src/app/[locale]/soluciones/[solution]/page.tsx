import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PulsarSolutionView } from "@/components/organisms/pulsar/PulsarSolutionView";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { isPulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; solution: string }>;
  searchParams: Promise<{ pais?: string | string[] }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  if (!(await isPulsarPlatformRequest())) return {};
  const { locale, solution } = await params;
  if (!isPulsarSolutionSlug(solution)) return {};
  const { dict } = await loadCentrolistoDictionary(locale, await searchParams);
  const copy = dict.pulsar.solutionSet[solution];
  const share = await centrolistoShareMetadata({
    title: copy.seoTitle,
    description: copy.seoDescription,
    siteName: dict.pulsar.meta.brandName,
    locale,
    suffix: `/soluciones/${solution}`,
  });
  return {
    title: { absolute: copy.seoTitle },
    description: copy.seoDescription,
    ...share,
  };
}

export default async function PulsarSolutionPage({ params, searchParams }: PageProps) {
  if (!(await isPulsarPlatformRequest())) notFound();
  const { locale, solution } = await params;
  if (!isPulsarSolutionSlug(solution)) notFound();
  const query = await searchParams;
  const [loaded, session] = await Promise.all([
    loadCentrolistoDictionary(locale, query),
    getPulsarCookieSession(),
  ]);
  return (
    <PulsarSolutionView
      locale={locale}
      dict={loaded.dict}
      solution={solution}
      email={session?.email ?? null}
      market={loaded.market}
    />
  );
}

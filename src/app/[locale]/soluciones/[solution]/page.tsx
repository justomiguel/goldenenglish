import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PulsarSolutionView } from "@/components/organisms/pulsar/PulsarSolutionView";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { centrolistoShareMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { isPulsarSolutionSlug } from "@/lib/pulsar/pulsarSolutionSlugs";
import { getPulsarCookieSession } from "@/lib/pulsar/pulsarStaffAuth";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string; solution: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!(await isPulsarPlatformRequest())) return {};
  const { locale, solution } = await params;
  if (!isPulsarSolutionSlug(solution)) return {};
  const dict = await getDictionary(locale as AppLocale);
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

export default async function PulsarSolutionPage({ params }: PageProps) {
  if (!(await isPulsarPlatformRequest())) notFound();
  const { locale, solution } = await params;
  if (!isPulsarSolutionSlug(solution)) notFound();
  const [dict, session] = await Promise.all([
    getDictionary(locale as AppLocale),
    getPulsarCookieSession(),
  ]);
  return (
    <PulsarSolutionView
      locale={locale}
      dict={dict}
      solution={solution}
      email={session?.email ?? null}
    />
  );
}

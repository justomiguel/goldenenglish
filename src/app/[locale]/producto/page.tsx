import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarProductoView } from "@/components/organisms/pulsar/PulsarProductoView";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!(await isPulsarPlatformRequest())) return {};
  const { locale } = await params;
  const dict = await getDictionary(locale as AppLocale);
  return {
    title: dict.pulsar.meta.productoTitle,
    description: dict.pulsar.meta.description,
  };
}

export default async function PulsarProductoPage({ params }: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale } = await params;
  const dict = await getDictionary(locale as AppLocale);
  return <PulsarProductoView locale={locale} dict={dict} />;
}

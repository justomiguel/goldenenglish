import { notFound, redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { getPulsarStaffSession, pulsarStaffHomePath } from "@/lib/pulsar/pulsarStaffAuth";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarAdminLoginForm } from "@/components/organisms/pulsar/PulsarAdminLoginForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}

export default async function PulsarAdminLoginPage({
  params,
  searchParams,
}: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale } = await params;
  const session = await getPulsarStaffSession();
  if (session) {
    redirect(pulsarStaffHomePath(locale, session));
  }
  const [dict, query] = await Promise.all([
    getDictionary(locale as AppLocale),
    searchParams,
  ]);
  return (
    <PulsarAdminLoginForm
      locale={locale}
      dict={dict}
      unauthorizedNotice={query.error === "unauthorized"}
    />
  );
}

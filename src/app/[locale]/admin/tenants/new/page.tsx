import { notFound, redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarAdminChrome } from "@/components/organisms/pulsar/PulsarAdminChrome";
import { PulsarAdminTenantForm } from "@/components/organisms/pulsar/PulsarAdminTenantForm";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PulsarAdminNewTenantPage({ params }: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale } = await params;
  const session = await getPulsarStaffSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }
  if (session.mustChangePassword) {
    redirect(`/${locale}/admin/password`);
  }
  const dict = await getDictionary(locale as AppLocale);
  return (
    <PulsarAdminChrome locale={locale} dict={dict} email={session.email}>
      <PulsarAdminTenantForm locale={locale} dict={dict} initialTenant={null} />
    </PulsarAdminChrome>
  );
}

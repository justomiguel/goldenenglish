import { notFound, redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { loadPulsarPlatformHostsForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { isGenericInstituteKind } from "@/lib/theme/genericInstituteTemplates";
import { PulsarAdminChrome } from "@/components/organisms/pulsar/PulsarAdminChrome";
import { PulsarAdminTenantForm } from "@/components/organisms/pulsar/PulsarAdminTenantForm";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ starter?: string | string[] }>;
}

export default async function PulsarAdminNewTenantPage({ params, searchParams }: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale } = await params;
  const query = await searchParams;
  const rawStarter = Array.isArray(query.starter) ? query.starter[0] : query.starter;
  const starterKind = rawStarter && isGenericInstituteKind(rawStarter) ? rawStarter : null;
  const session = await getPulsarStaffSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }
  if (session.mustChangePassword) {
    redirect(`/${locale}/admin/password`);
  }
  const [dict, pulsarHosts] = await Promise.all([
    getDictionary(locale as AppLocale),
    loadPulsarPlatformHostsForAdmin(),
  ]);
  return (
    <PulsarAdminChrome locale={locale} dict={dict} email={session.email}>
      <PulsarAdminTenantForm
        locale={locale}
        dict={dict}
        initialTenant={null}
        pulsarHosts={pulsarHosts}
        starterKind={starterKind}
      />
    </PulsarAdminChrome>
  );
}

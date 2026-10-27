import { notFound, redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { loadPulsarFleetTelemetry } from "@/lib/pulsar/loadPulsarFleetTelemetry";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import {
  loadAllPulsarTenantsForAdmin,
  loadPulsarPlatformHostsForAdmin,
} from "@/lib/pulsar/pulsarTenantStore";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarAdminFleetScreen } from "@/components/organisms/pulsar/PulsarAdminFleetScreen";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PulsarAdminPage({ params }: PageProps) {
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

  const [dict, tenants, platformHosts] = await Promise.all([
    getDictionary(locale as AppLocale),
    loadAllPulsarTenantsForAdmin(),
    loadPulsarPlatformHostsForAdmin(),
  ]);
  const telemetryBySlug = await loadPulsarFleetTelemetry(tenants);

  return (
    <PulsarAdminFleetScreen
      locale={locale}
      dict={dict}
      staffEmail={session.email}
      sessionMode={session.mode}
      tenants={tenants}
      telemetryBySlug={telemetryBySlug}
      platformHosts={platformHosts}
    />
  );
}

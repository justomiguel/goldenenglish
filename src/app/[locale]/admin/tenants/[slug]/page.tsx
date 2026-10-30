import { notFound, redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { connectedPartners } from "@/lib/pulsar/connectedPartners";
import { loadEnabledPaymentProviders } from "@/lib/pulsar/loadEnabledPaymentProviders";
import { loadInstituteVisitSeries } from "@/lib/pulsar/loadInstituteVisitSeries";
import { loadPulsarFleetReview } from "@/lib/pulsar/loadPulsarFleetReview";
import { loadPulsarFleetTelemetry } from "@/lib/pulsar/loadPulsarFleetTelemetry";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import {
  loadPulsarPlatformHostsForAdmin,
  loadPulsarTenantBySlugForAdmin,
} from "@/lib/pulsar/pulsarTenantStore";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarAdminChrome } from "@/components/organisms/pulsar/PulsarAdminChrome";
import { PulsarAdminTenantForm } from "@/components/organisms/pulsar/PulsarAdminTenantForm";
import { PulsarAdminTenantSummary } from "@/components/organisms/pulsar/PulsarAdminTenantSummary";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function PulsarAdminEditTenantPage({ params }: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale, slug } = await params;
  const session = await getPulsarStaffSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }
  if (session.mustChangePassword) {
    redirect(`/${locale}/admin/password`);
  }

  const [dict, tenant, platformHosts] = await Promise.all([
    getDictionary(locale as AppLocale),
    loadPulsarTenantBySlugForAdmin(slug),
    loadPulsarPlatformHostsForAdmin(),
  ]);
  if (!tenant) {
    notFound();
  }
  const [telemetryBySlug, reviewBySlug, series, gateways] = await Promise.all([
    loadPulsarFleetTelemetry([tenant]),
    loadPulsarFleetReview([tenant], platformHosts),
    loadInstituteVisitSeries(tenant),
    loadEnabledPaymentProviders(tenant),
  ]);
  const partners = connectedPartners({
    resend: Boolean(tenant.resendApiKey || tenant.resendFromEmail),
    whatsapp: Boolean(tenant.whatsappAccessToken || tenant.whatsappPhoneNumberId),
    maps: Boolean(tenant.googleMapsApiKey),
    kv: Boolean(tenant.kvRestApiUrl),
    hosts: tenant.hosts.length > 0,
    gateways,
  });

  const openHref = tenant.publicUrl ?? (tenant.hosts[0] ? `https://${tenant.hosts[0]}` : null);

  return (
    <PulsarAdminChrome locale={locale} dict={dict} email={session.email}>
    <PulsarAdminTenantForm
      locale={locale}
      dict={dict}
      initialTenant={tenant}
      masthead={
        <PulsarAdminTenantSummary
          locale={locale}
          name={tenant.displayName}
          slug={tenant.slug}
          enabled={tenant.isEnabled}
          hosts={tenant.hosts}
          snap={telemetryBySlug[tenant.slug]}
          review={reviewBySlug[tenant.slug]}
          series={series}
          copy={dict.pulsar.admin.table}
          themeHref={`/${locale}/admin/tenants/${slug}/theme`}
          themeLabel={dict.pulsar.admin.form.themeCta}
          openHref={openHref}
          openLabel={dict.pulsar.admin.table.openPublicSite}
          partners={partners}
        />
      }
    />
    </PulsarAdminChrome>
  );
}

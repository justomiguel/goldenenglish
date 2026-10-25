import { notFound, redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { loadPulsarTenantBySlugForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarAdminTenantForm } from "@/components/organisms/pulsar/PulsarAdminTenantForm";

export const dynamic = "force-dynamic";

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

  const [dict, tenant] = await Promise.all([
    getDictionary(locale as AppLocale),
    loadPulsarTenantBySlugForAdmin(slug),
  ]);
  if (!tenant) {
    notFound();
  }

  return (
    <PulsarAdminTenantForm locale={locale} dict={dict} initialTenant={tenant} />
  );
}

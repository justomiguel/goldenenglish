import { notFound, redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarAdminChrome } from "@/components/organisms/pulsar/PulsarAdminChrome";
import { PulsarTenantRestoreForm } from "@/components/organisms/pulsar/PulsarTenantRestoreForm";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PulsarRestoreTenantPage({ params }: PageProps) {
  if (!(await isPulsarPlatformRequest())) notFound();
  const { locale } = await params;
  const session = await getPulsarStaffSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (session.mustChangePassword) redirect(`/${locale}/admin/password`);
  const dict = await getDictionary(locale as AppLocale);
  return (
    <PulsarAdminChrome locale={locale} dict={dict} email={session.email}>
      <PulsarTenantRestoreForm locale={locale} copy={dict.pulsar.admin.form.backup} />
    </PulsarAdminChrome>
  );
}

import { notFound, redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarAdminPasswordForm } from "@/components/organisms/pulsar/PulsarAdminPasswordForm";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function PulsarAdminPasswordPage({ params }: PageProps) {
  if (!(await isPulsarPlatformRequest())) {
    notFound();
  }
  const { locale } = await params;
  const session = await getPulsarStaffSession();
  if (!session) {
    redirect(`/${locale}/admin/login`);
  }
  if (!session.mustChangePassword) {
    redirect(`/${locale}/admin`);
  }
  const dict = await getDictionary(locale as AppLocale);
  return <PulsarAdminPasswordForm locale={locale} dict={dict} />;
}

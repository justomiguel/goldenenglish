import { notFound, redirect } from "next/navigation";
import { getDictionary, type AppLocale } from "@/lib/i18n/dictionaries";
import { loadPlatformUserProfile } from "@/lib/pulsar/platformUserProfileStore";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import { isPulsarPlatformRequest } from "@/lib/tenant/tenantRequestContext";
import { PulsarAdminChrome } from "@/components/organisms/pulsar/PulsarAdminChrome";
import { PulsarProfileForm } from "@/components/organisms/pulsar/PulsarProfileForm";

export const dynamic = "force-dynamic";

export default async function PulsarStaffProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (!(await isPulsarPlatformRequest())) notFound();
  const { locale } = await params;
  const session = await getPulsarStaffSession();
  if (!session) redirect(`/${locale}/admin/login`);
  if (session.mustChangePassword) redirect(`/${locale}/admin/password`);
  const [dict, profile] = await Promise.all([
    getDictionary(locale as AppLocale),
    loadPlatformUserProfile(session.userId),
  ]);
  return (
    <PulsarAdminChrome locale={locale} dict={dict} email={session.email}>
      <PulsarProfileForm
        locale={locale}
        email={session.email}
        displayName={profile.displayName}
        phone={profile.phone}
        avatarUrl={profile.avatarUrl}
        copy={dict.pulsar.profile}
      />
    </PulsarAdminChrome>
  );
}

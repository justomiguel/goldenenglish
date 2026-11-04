import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PulsarProfileForm } from "@/components/organisms/pulsar/PulsarProfileForm";
import { centrolistoPrivatePageMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { loadPlatformUserProfile } from "@/lib/pulsar/platformUserProfileStore";
import { createPulsarServerClient, isPulsarSupabaseConfigured } from "@/lib/supabase/pulsar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { dict } = await loadCentrolistoDictionary(locale);
  return centrolistoPrivatePageMetadata({
    locale,
    title: dict.pulsar.profile.title,
    description: dict.pulsar.profile.lead,
    siteName: dict.pulsar.meta.brandName,
    suffix: "/cuenta/perfil",
  });
}

export default async function PulsarProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isPulsarSupabaseConfigured()) redirect(`/${locale}/cuenta/login`);
  const server = await createPulsarServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user?.email) redirect(`/${locale}/cuenta/login`);
  const profile = await loadPlatformUserProfile(user.id);
  const { dict } = await loadCentrolistoDictionary(locale);
  return (
    <PulsarProfileForm
      locale={locale}
      email={user.email}
      displayName={profile.displayName}
      phone={profile.phone}
      avatarUrl={profile.avatarUrl}
      copy={dict.pulsar.profile}
    />
  );
}

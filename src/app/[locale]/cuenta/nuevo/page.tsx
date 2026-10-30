import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { PulsarAccountCreateForm } from "@/components/organisms/pulsar/PulsarAccountCreateForm";
import { loadPulsarOwnerHome } from "@/lib/pulsar/pulsarOwnerAccount";
import { canCreateFreeSite } from "@/lib/pulsar/freeSitePlan";
import { GENERIC_INSTITUTE_KINDS } from "@/lib/theme/genericInstituteTemplates";
import {
  createPulsarServerClient,
  isPulsarSupabaseConfigured,
} from "@/lib/supabase/pulsar";

export default async function PulsarAccountNewSitePage({
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
  if (!user) redirect(`/${locale}/cuenta/login`);
  const home = await loadPulsarOwnerHome(user.id);
  if (home.kind !== "owner" || home.status !== "approved") redirect(`/${locale}/cuenta`);
  if (!canCreateFreeSite(home.ownedCount)) redirect(`/${locale}/cuenta`);
  const dict = await getDictionary(locale);
  const kindLabels = Object.fromEntries(
    GENERIC_INSTITUTE_KINDS.map((kind) => [kind, dict.landing.genericLandings[kind].name]),
  ) as Record<(typeof GENERIC_INSTITUTE_KINDS)[number], string>;
  return (
    <PulsarAccountCreateForm locale={locale} copy={dict.pulsar.account} kindLabels={kindLabels} />
  );
}

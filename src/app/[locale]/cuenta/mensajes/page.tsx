import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { FreeSiteMessageList } from "@/components/organisms/pulsar/FreeSiteMessageList";
import { centrolistoPrivatePageMetadata } from "@/lib/pulsar/centrolistoShareMetadata";
import { loadFreeSiteMessages } from "@/lib/pulsar/freeSiteMessages";
import { loadCentrolistoDictionary } from "@/lib/pulsar/loadCentrolistoDictionary";
import { loadPulsarOwnerHome } from "@/lib/pulsar/pulsarOwnerAccount";
import { freeSiteMessageRange } from "@/lib/pulsar/freeSiteMessagePage";
import {
  createPulsarAdminClient,
  createPulsarServerClient,
  isPulsarSupabaseConfigured,
} from "@/lib/supabase/pulsar";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { dict } = await loadCentrolistoDictionary(locale, {});
  return centrolistoPrivatePageMetadata({
    locale,
    title: dict.pulsar.account.inboxTitle,
    description: dict.pulsar.account.inboxLead,
    siteName: dict.pulsar.meta.brandName,
    suffix: "/cuenta/mensajes",
  });
}

export default async function PulsarAccountMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale } = await params;
  if (!isPulsarSupabaseConfigured()) redirect(`/${locale}/cuenta/login`);
  const server = await createPulsarServerClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) redirect(`/${locale}/cuenta/login`);

  const admin = createPulsarAdminClient();
  const { data: staff } = await admin
    .from("platform_staff")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (staff) redirect(`/${locale}/admin`);

  const home = await loadPulsarOwnerHome(user.id);
  if (home.kind !== "owner") redirect(`/${locale}/cuenta/nuevo`);
  const { dict } = await loadCentrolistoDictionary(locale, {});
  const copy = dict.pulsar.account;
  const requested = Number((await searchParams).page);
  const range = freeSiteMessageRange(requested);
  const messages = await loadFreeSiteMessages({
    slugs: home.sites.map((site) => site.slug),
    page: range.page,
  });
  const siteNames = Object.fromEntries(home.sites.map((site) => [site.slug, site.displayName]));

  return (
    <div className="mx-auto max-w-xl px-5 py-16">
      <FreeSiteMessageList
        locale={locale}
        rows={messages.rows}
        total={messages.total}
        page={range.page}
        siteNames={siteNames}
        pagerHref={`/${locale}/cuenta/mensajes`}
        labels={{
          title: copy.inboxTitle,
          lead: copy.inboxLead,
          empty: copy.inboxEmpty,
          site: copy.inboxSite,
          previous: copy.inboxPrevious,
          next: copy.inboxNext,
        }}
      />
    </div>
  );
}

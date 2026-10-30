import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { loadPulsarOwnerHome } from "@/lib/pulsar/pulsarOwnerAccount";
import { customHostBesidePreview, domainDnsRecord, previewSiteUrl } from "@/lib/pulsar/ownerSiteLinks";
import { loadPulsarPlatformHostsForAdmin } from "@/lib/pulsar/pulsarTenantStore";
import { FREE_SITE_LIMIT } from "@/lib/pulsar/freeSitePlan";
import { previewHostsForTenantSlug } from "@/lib/tenant/pulsarSubdomain";
import { PulsarAccountSiteCard } from "@/components/organisms/pulsar/PulsarAccountSiteCard";
import {
  createPulsarAdminClient,
  createPulsarServerClient,
  isPulsarSupabaseConfigured,
} from "@/lib/supabase/pulsar";

export default async function PulsarAccountHomePage({
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

  const admin = createPulsarAdminClient();
  const { data: staff } = await admin
    .from("platform_staff")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (staff) redirect(`/${locale}/admin`);

  const home = await loadPulsarOwnerHome(user.id);
  if (home.kind !== "owner") redirect(`/${locale}/cuenta/registro`);
  const dict = await getDictionary(locale);
  const copy = dict.pulsar.account;
  const approved = home.status === "approved";
  const canCreate = approved && home.ownedCount < FREE_SITE_LIMIT;
  const platformHosts = await loadPulsarPlatformHostsForAdmin();
  const sites = home.sites.map((site) => {
    const previewHosts = previewHostsForTenantSlug(site.slug, platformHosts);
    const customDomain = customHostBesidePreview(site.hosts, previewHosts);
    const dns = domainDnsRecord(customDomain);
    const dnsText = dns
      ? (dns.kind === "cname" ? copy.dnsCname : copy.dnsApex)
          .replaceAll("{name}", dns.name)
          .replaceAll("{target}", dns.target)
      : "";
    return {
      slug: site.slug,
      displayName: site.displayName,
      previewUrl: previewSiteUrl(previewHosts),
      customDomain,
      dnsText,
    };
  });

  return (
    <section className="mx-auto max-w-xl space-y-6 px-5 py-16">
      <h1 className="text-2xl font-medium">{copy.homeTitle}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {home.status === "pending" ? copy.pendingLead : home.status === "rejected" ? copy.rejectedLead : copy.homeLead}
      </p>
      <p className="text-sm text-[var(--color-muted-foreground)]">{copy.pageOnly}</p>
      {approved && sites.length === 0 ? <p className="text-sm">{copy.empty}</p> : null}
      <ul className="space-y-3">
        {sites.map((site) => (
          <PulsarAccountSiteCard key={site.slug} locale={locale} site={site} copy={copy} />
        ))}
      </ul>
      {canCreate ? (
        <Link
          href={`/${locale}/cuenta/nuevo`}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--color-primary)]"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {copy.create}
        </Link>
      ) : approved ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{copy.limitReached}</p>
      ) : null}
    </section>
  );
}

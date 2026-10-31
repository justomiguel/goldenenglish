import { type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  ExternalLink,
  GitBranch,
  Globe,
  Mail,
  Palette,
  PauseCircle,
  UserRound,
} from "lucide-react";
import { PulsarAdminFleetHostLines } from "@/components/organisms/pulsar/PulsarAdminFleetHostLines";
import { PulsarAdminPartnerRow } from "@/components/organisms/pulsar/PulsarAdminPartnerRow";
import { PulsarInstituteVisitChart } from "@/components/organisms/pulsar/PulsarInstituteVisitChart";
import type { PartnerId } from "@/lib/pulsar/connectedPartners";
import type { FleetSiteReview } from "@/lib/pulsar/fleetSiteReview";
import type { TenantTelemetrySnapshot } from "@/lib/pulsar/loadPulsarFleetTelemetry";
import type { VisitDayPoint } from "@/lib/pulsar/visitDaySeries";
import type { Dictionary } from "@/types/i18n";

type TableCopy = Dictionary["pulsar"]["admin"]["table"];

export interface PulsarAdminTenantSummaryProps {
  locale: string;
  name: string;
  slug: string;
  enabled: boolean;
  hosts: readonly string[];
  snap: TenantTelemetrySnapshot | undefined;
  review: FleetSiteReview | undefined;
  series: readonly VisitDayPoint[] | null;
  copy: TableCopy;
  themeHref: string;
  themeLabel: string;
  openHref: string | null;
  openLabel: string;
  partners: readonly PartnerId[];
  mailSent: number;
  mailQuota: number;
}

function Fact({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 py-4">
      <span className="mt-0.5 text-[var(--color-primary)]" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs text-[var(--color-muted-foreground)]">{label}</div>
        <div className="mt-1 text-sm leading-relaxed text-[var(--color-foreground)]">{children}</div>
      </div>
    </div>
  );
}

export function PulsarAdminTenantSummary({
  locale,
  name,
  slug,
  enabled,
  hosts,
  snap,
  review,
  series,
  copy,
  themeHref,
  themeLabel,
  openHref,
  openLabel,
  partners,
  mailSent,
  mailQuota,
}: PulsarAdminTenantSummaryProps) {
  const numFmt = new Intl.NumberFormat(locale);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });
  const online = enabled && snap?.status === "online";
  const migration =
    review?.migrationState === "current"
      ? copy.migrationCurrent
      : review?.migrationState === "behind"
        ? copy.migrationBehind
        : copy.migrationUnknown;
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex items-center gap-5">
          {snap?.logoUrl ? (
            <span className="grid h-20 w-32 shrink-0 place-items-center bg-[var(--color-surface)] px-3">
              <img src={snap.logoUrl} alt="" className="max-h-16 max-w-full object-contain" />
            </span>
          ) : (
            <span
              aria-hidden
              className="grid h-20 w-20 shrink-0 place-items-center bg-[var(--color-surface)] text-2xl font-medium text-[var(--color-foreground)]"
            >
              {name.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-[var(--color-foreground)]">{name}</h1>
            <p className="mt-1 font-mono text-xs text-[var(--color-muted-foreground)]">{slug}</p>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-[var(--color-foreground)]">
              {!enabled ? (
                <>
                  <PauseCircle className="h-4 w-4" aria-hidden />
                  {copy.statusDisabled}
                </>
              ) : online ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
                  {copy.statusOnline}
                  {snap?.latencyMs != null ? <span className="font-mono text-xs">({snap.latencyMs} ms)</span> : null}
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-[var(--color-error)]" aria-hidden />
                  {copy.statusError}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {openHref ? (
            <a
              href={openHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 text-sm font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              {openLabel}
            </a>
          ) : null}
          <Link
            href={themeHref}
            className="inline-flex min-h-11 items-center gap-2 bg-[var(--color-primary)] px-3.5 text-sm font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
          >
            <Palette className="h-4 w-4" aria-hidden />
            {themeLabel}
          </Link>
        </div>
      </div>

      <div className="mt-10 grid items-start gap-12 lg:grid-cols-[minmax(0,1.7fr)_20rem]">
        <div className="bg-[var(--color-surface)] px-5 py-6 sm:px-6">
          <PulsarInstituteVisitChart
            locale={locale}
            series={series}
            title={copy.chartTitle}
            emptyLabel={copy.chartEmpty}
            visitsLabel={copy.chartVisits}
          />
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
            {copy.visits7d}: {snap?.visits7d != null ? numFmt.format(snap.visits7d) : "—"}
            {" · "}
            {copy.visits30d}: {snap?.visits30d != null ? numFmt.format(snap.visits30d) : "—"}
          </p>
        </div>
        <div className="divide-y divide-[var(--color-border)] border-y border-[var(--color-border)]">
          <Fact icon={<Database className="h-4 w-4" />} label={copy.columnBase}>
            {review ? (review.dataMode === "shared_schema" ? copy.dataModeShared : copy.dataModeProject) : "—"}
            {review ? (
              <span className="mt-1 block font-mono text-xs text-[var(--color-muted-foreground)]">{review.schemaName}</span>
            ) : null}
          </Fact>
          <Fact icon={<GitBranch className="h-4 w-4" />} label={copy.columnMigration}>
            {review ? migration : "—"}
            {review?.migrationHead ? (
              <span className="mt-1 block truncate font-mono text-xs text-[var(--color-muted-foreground)]">
                {review.migrationState === "current" ? review.migrationApplied : review.migrationHead}
              </span>
            ) : null}
          </Fact>
          <Fact icon={<UserRound className="h-4 w-4" />} label={copy.columnOwner}>
            {review?.ownerEmail ? (
              <>
                {review.ownerEmail}
                <span className="mt-1 block text-xs text-[var(--color-muted-foreground)]">
                  {copy.ownerSlots.replace("{used}", String(review.ownerUsed ?? 0))}
                </span>
              </>
            ) : (
              copy.ownerStaff
            )}
          </Fact>
          <Fact icon={<Clock className="h-4 w-4" />} label={copy.lastHit}>
            {snap?.lastHitAt ? dateFmt.format(new Date(snap.lastHitAt)) : copy.noHits}
          </Fact>
          <Fact icon={<Mail className="h-4 w-4" />} label={copy.pulsarMail}>
            {copy.pulsarMailCount
              .replace("{sent}", numFmt.format(mailSent))
              .replace("{quota}", numFmt.format(mailQuota))}
          </Fact>
          <Fact icon={<Globe className="h-4 w-4" />} label={copy.hosts}>
            <PulsarAdminFleetHostLines review={review} fallbackHosts={hosts} copy={copy} />
          </Fact>
        </div>
      </div>
      <PulsarAdminPartnerRow
        title={copy.partnersTitle}
        partners={partners}
        label={{
          flow: copy.partnerFlow,
          mercadopago: copy.partnerMercadoPago,
          whatsapp: copy.partnerWhatsapp,
          resend: copy.partnerResend,
          googlemaps: copy.partnerMaps,
          upstash: copy.partnerUpstash,
          supabase: copy.partnerSupabase,
          vercel: copy.partnerVercel,
        }}
      />
    </section>
  );
}

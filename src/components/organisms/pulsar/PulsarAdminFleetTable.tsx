import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ExternalLink,
  PauseCircle,
  PlayCircle,
} from "lucide-react";
import { PulsarFleetLogo } from "@/components/organisms/pulsar/PulsarFleetLogo";
import type { TenantTelemetrySnapshot } from "@/lib/pulsar/loadPulsarFleetTelemetry";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import type { Dictionary } from "@/types/i18n";

export interface PulsarAdminFleetTableProps {
  locale: string;
  dict: Dictionary;
  tenants: readonly PulsarTenantRecord[];
  telemetryBySlug: Record<string, TenantTelemetrySnapshot>;
  busySlug: string | null;
  onToggleTenant: (slug: string, nextEnabled: boolean) => void;
}

export function PulsarAdminFleetTable({
  locale,
  dict,
  tenants,
  telemetryBySlug,
  busySlug,
  onToggleTenant,
}: PulsarAdminFleetTableProps) {
  const copy = dict.pulsar.admin;
  const numFmt = new Intl.NumberFormat(locale);

  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]/60 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
            <th className="px-4 py-3.5">{copy.table.tenant}</th>
            <th className="px-4 py-3.5">{copy.table.status}</th>
            <th className="px-4 py-3.5 text-right">{copy.table.visits7d}</th>
            <th className="px-4 py-3.5 text-right">{copy.table.actions}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {tenants.map((tenant) => {
            const snap = telemetryBySlug[tenant.slug];
            const isOnline = tenant.isEnabled && snap?.status === "online";
            const publicHref =
              tenant.publicUrl ??
              (tenant.hosts[0] ? `https://${tenant.hosts[0]}` : null);
            return (
              <tr key={tenant.slug} className="hover:bg-[var(--color-muted)]/30">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <PulsarFleetLogo
                      src={snap?.logoUrl ?? null}
                      fallback={tenant.displayName.slice(0, 1).toUpperCase()}
                    />
                    <div>
                      <Link
                        href={`/${locale}/admin/tenants/${tenant.slug}`}
                        className="font-bold text-[var(--color-foreground)] hover:underline"
                      >
                        {tenant.displayName}
                      </Link>
                      <div className="font-mono text-xs text-[var(--color-muted-foreground)]">
                        {tenant.slug}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {!tenant.isEnabled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--color-muted-foreground)]">
                      <PauseCircle className="h-3.5 w-3.5" aria-hidden />
                      <span>{copy.table.statusDisabled}</span>
                    </span>
                  ) : isOnline ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-muted)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      <span>{copy.table.statusOnline}</span>
                      {snap?.latencyMs != null ? (
                        <span className="font-mono text-[11px] text-[var(--color-muted-foreground)]">
                          ({snap.latencyMs} ms)
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-error)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-error)]">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                      <span>{copy.table.statusError}</span>
                      {snap?.errorCode ? (
                        <span className="font-mono text-[11px]">({snap.errorCode})</span>
                      ) : null}
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 text-right font-mono font-semibold">
                  {snap?.visits7d != null ? numFmt.format(snap.visits7d) : "—"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {publicHref ? (
                      <a
                        href={publicHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        <span>{copy.table.openPublicSite}</span>
                      </a>
                    ) : null}
                    <button
                      type="button"
                      disabled={busySlug === tenant.slug}
                      onClick={() => onToggleTenant(tenant.slug, !tenant.isEnabled)}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)] disabled:opacity-50"
                    >
                      {tenant.isEnabled ? (
                        <>
                          <PauseCircle className="h-3.5 w-3.5" aria-hidden />
                          <span>{copy.table.disableAction}</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-3.5 w-3.5" aria-hidden />
                          <span>{copy.table.enableAction}</span>
                        </>
                      )}
                    </button>
                    <Link
                      href={`/${locale}/admin/tenants/${tenant.slug}`}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
                    >
                      <Edit3 className="h-3.5 w-3.5" aria-hidden />
                      <span>{copy.editTenantCta}</span>
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

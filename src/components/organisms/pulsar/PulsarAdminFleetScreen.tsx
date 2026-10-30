"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, Building2, Eye, Layers, LogOut, Mail, Plus, Users } from "lucide-react";
import { PulsarAdminMailSettings } from "@/components/organisms/pulsar/PulsarAdminMailSettings";
import { PulsarAdminOwnerReview } from "@/components/organisms/pulsar/PulsarAdminOwnerReview";
import { UnderlineTabBar, type UnderlineTabItem } from "@/components/molecules/UnderlineTabBar";
import { usePersistentPageTab } from "@/hooks/usePersistentPageTab";
import {
  signOutPulsarStaffAction,
  togglePulsarTenantEnabledAction,
} from "@/app/[locale]/admin/actions";
import { PulsarAdminFleetTable } from "@/components/organisms/pulsar/PulsarAdminFleetTable";
import { PulsarAdminFleetVisitChart } from "@/components/organisms/pulsar/PulsarAdminFleetVisitChart";
import { PulsarAdminPlatformHostsCard } from "@/components/organisms/pulsar/PulsarAdminPlatformHostsCard";
import type { TenantTelemetrySnapshot } from "@/lib/pulsar/loadPulsarFleetTelemetry";
import type { PulsarTenantRecord } from "@/lib/pulsar/pulsarTenantMapper";
import type { Dictionary } from "@/types/i18n";

export interface PulsarAdminFleetScreenProps {
  locale: string;
  dict: Dictionary;
  staffEmail: string;
  sessionMode: "pulsar-db" | "dev-local";
  tenants: readonly PulsarTenantRecord[];
  telemetryBySlug: Record<string, TenantTelemetrySnapshot>;
  platformHosts?: readonly string[];
  owners?: readonly { userId: string; email: string; status: "pending" | "approved" | "rejected" }[];
  mailSettings?: {
    fromEmail: string;
    notifyEmail: string;
    hasApiKey: boolean;
    last: { ok: boolean; code: string; detail: string; at: string } | null;
  };
}

const ADMIN_TABS = ["sites", "accounts", "mail"] as const;

export function PulsarAdminFleetScreen({
  locale,
  dict,
  staffEmail,
  sessionMode,
  tenants,
  telemetryBySlug,
  platformHosts = [],
  owners = [],
  mailSettings = { fromEmail: "", notifyEmail: "", hasApiKey: false, last: null },
}: PulsarAdminFleetScreenProps) {
  const router = useRouter();
  const copy = dict.pulsar.admin;
  const { value: tab, setValue: setTab } = usePersistentPageTab({
    allowed: ADMIN_TABS,
    fallback: "sites",
  });
  const adminTabs: UnderlineTabItem[] = [
    { id: "sites", label: copy.tabSites, Icon: Building2 },
    { id: "accounts", label: copy.tabAccounts, Icon: Users },
    { id: "mail", label: copy.tabMail, Icon: Mail },
  ];
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const numFmt = new Intl.NumberFormat(locale);

  const onlineCount = tenants.filter(
    (t) => t.isEnabled && telemetryBySlug[t.slug]?.status === "online",
  ).length;
  const total7d = tenants.reduce(
    (acc, t) => acc + (telemetryBySlug[t.slug]?.visits7d ?? 0),
    0,
  );
  const total30d = tenants.reduce(
    (acc, t) => acc + (telemetryBySlug[t.slug]?.visits30d ?? 0),
    0,
  );

  const handleToggle = async (slug: string, nextEnabled: boolean) => {
    setBusySlug(slug);
    const res = await togglePulsarTenantEnabledAction({
      locale,
      slug,
      isEnabled: nextEnabled,
    });
    setBusySlug(null);
    if (res.ok) {
      router.refresh();
    }
  };

  const handleSignOut = async () => {
    await signOutPulsarStaffAction(locale);
    router.push(`/${locale}/admin/login`);
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/${locale}`}
              className="inline-flex items-center gap-2 text-base font-bold text-[var(--color-foreground)]"
            >
              <Layers className="h-5 w-5 text-[var(--color-primary)]" aria-hidden />
              <span>{dict.pulsar.meta.brandName}</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-[var(--color-muted-foreground)] sm:inline">
              {staffEmail}
            </span>
            <Link
              href={`/${locale}/admin/tenants/new`}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-lg bg-[var(--color-primary)] px-3.5 py-2 text-xs font-semibold text-[var(--color-primary-foreground)] transition-colors hover:bg-[var(--color-primary-dark)]"
            >
              <Plus className="h-4 w-4" aria-hidden />
              <span>{copy.newTenantCta}</span>
            </Link>
            {sessionMode === "pulsar-db" ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                <span>{copy.signOut}</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-xs text-[var(--color-muted-foreground)]">
          <span className="inline-flex items-center gap-2 font-medium text-[var(--color-foreground)]">
            <Activity className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <span>
              {sessionMode === "dev-local" ? copy.devModeBanner : copy.pulsarDbBanner}
            </span>
          </span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--color-foreground)]">
          {copy.title}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{copy.lead}</p>
        <div className="mt-6">
          <UnderlineTabBar
            idPrefix="pulsar-admin"
            ariaLabel={copy.title}
            items={adminTabs}
            value={tab}
            onChange={(id) => {
              if (id === "sites" || id === "accounts" || id === "mail") setTab(id);
            }}
          />
        </div>
        {tab === "accounts" ? <div className="mt-6"><PulsarAdminOwnerReview locale={locale} owners={owners} copy={copy.owners} /></div> : null}
        {tab === "mail" ? <div className="mt-6"><PulsarAdminMailSettings locale={locale} settings={mailSettings} copy={copy.mail} /></div> : null}
        {tab === "sites" ? (
        <>
        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm text-[var(--color-muted-foreground)]">
          <li className="inline-flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <span>{copy.summary.totalTenants}</span>
            <span className="font-semibold text-[var(--color-foreground)]">{numFmt.format(tenants.length)}</span>
          </li>
          <li className="inline-flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <span>{copy.summary.onlineTenants}</span>
            <span className="font-semibold text-[var(--color-foreground)]">
              {numFmt.format(onlineCount)} / {numFmt.format(tenants.length)}
            </span>
          </li>
          <li className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <span>{copy.summary.visits7d}</span>
            <span className="font-semibold text-[var(--color-foreground)]">{numFmt.format(total7d)}</span>
          </li>
          <li className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4 text-[var(--color-primary)]" aria-hidden />
            <span>{copy.summary.visits30d}</span>
            <span className="font-semibold text-[var(--color-foreground)]">{numFmt.format(total30d)}</span>
          </li>
        </ul>
        <PulsarAdminFleetVisitChart
          locale={locale}
          title={copy.table.fleetChartTitle}
          visitsLabel={copy.table.chartVisits}
          rows={tenants.map((tenant) => ({
            name: tenant.displayName,
            visits: telemetryBySlug[tenant.slug]?.visits7d ?? 0,
          }))}
        />

        <PulsarAdminPlatformHostsCard
          locale={locale}
          dict={dict}
          initialHosts={platformHosts}
        />

        <PulsarAdminFleetTable
          locale={locale}
          dict={dict}
          tenants={tenants}
          telemetryBySlug={telemetryBySlug}
          busySlug={busySlug}
          onToggleTenant={handleToggle}
        />
        </>
        ) : null}
      </main>
    </div>
  );
}

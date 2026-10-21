import Link from "next/link";
import { formatEventDay } from "@/lib/events/formatEventDate";
import type { Dictionary } from "@/types/i18n";
import type { AdminHomeExtraWidgets } from "@/lib/dashboard/loadAdminHomeExtraWidgets";
import { AdminHubHomeBoost } from "@/components/dashboard/AdminHubHomeBoost";
import { AdminHubMetricCard } from "@/components/dashboard/AdminHubMetricCard";
import { CalendarDays, ShoppingBag, Sparkles, Wallet } from "lucide-react";

const iconClass =
  "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]";

function money(locale: string, value: number): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

export function AdminHubHomePeoplePulseCard({
  base,
  dict,
  pulse,
}: {
  base: string;
  dict: Dictionary;
  pulse: AdminHomeExtraWidgets["peoplePulse"];
}) {
  const t = dict.admin.home.layout.widgets;
  const value = pulse ?? { newLast30Days: 0, neverEntered: 0 };
  return (
    <AdminHubMetricCard href={`${base}/students`} icon={<Sparkles className="h-6 w-6" />} title={t.peoplePulseTitle} accentClass={iconClass}>
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {t.peoplePulseNew}: <span className="font-semibold text-[var(--color-foreground)]">{value.newLast30Days}</span>
      </p>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        {t.peoplePulseNever}: <span className="font-semibold text-[var(--color-foreground)]">{value.neverEntered}</span>
      </p>
    </AdminHubMetricCard>
  );
}

export function AdminHubHomeCollectionsCard({
  locale,
  base,
  dict,
  collections,
}: {
  locale: string;
  base: string;
  dict: Dictionary;
  collections: AdminHomeExtraWidgets["collections"];
}) {
  const t = dict.admin.home.layout.widgets;
  return (
    <AdminHubMetricCard href={`${base}/finance/collections`} icon={<Wallet className="h-6 w-6" />} title={t.collectionsTitle} accentClass={iconClass}>
      {collections ? (
        <ul className="space-y-1 text-sm text-[var(--color-muted-foreground)]">
          <li>{collections.cohortName}</li>
          <li>{t.collectionsPaid}: {money(locale, collections.paid)}</li>
          <li>{t.collectionsPending}: {money(locale, collections.pendingReview)}</li>
          <li>{t.collectionsOverdue}: {money(locale, collections.overdue)}</li>
        </ul>
      ) : (
        <p className="text-sm text-[var(--color-muted-foreground)]">{t.collectionsEmpty}</p>
      )}
    </AdminHubMetricCard>
  );
}

export function AdminHubHomeEventsCard({
  locale,
  base,
  dict,
  events,
}: {
  locale: string;
  base: string;
  dict: Dictionary;
  events: AdminHomeExtraWidgets["upcomingEvents"];
}) {
  const t = dict.admin.home.layout.widgets;
  return (
    <AdminHubMetricCard href={`${base}/events`} icon={<CalendarDays className="h-6 w-6" />} title={t.eventsTitle} accentClass={iconClass}>
      {events.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">{t.eventsEmpty}</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => (
            <li key={event.id}>
              <Link href={`${base}/events/${event.id}`} className="text-sm font-medium text-[var(--color-primary)]">
                {event.title}
              </Link>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {formatEventDay(event.eventDate, locale)}
                {event.capacity != null ? ` · ${t.eventsSeats.replace("{{count}}", String(event.capacity))}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AdminHubMetricCard>
  );
}

export function AdminHubHomeShopCard({
  base,
  dict,
  openCount,
}: {
  base: string;
  dict: Dictionary;
  openCount: number | null;
}) {
  const t = dict.admin.home.layout.widgets;
  return (
    <AdminHubMetricCard href={`${base}/merch`} icon={<ShoppingBag className="h-6 w-6" />} title={t.shopTitle} accentClass={iconClass}>
      {openCount && openCount > 0 ? (
        <>
          <p className="text-4xl font-bold text-[var(--color-foreground)]">{openCount}</p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{t.shopOpen}</p>
        </>
      ) : (
        <p className="text-sm text-[var(--color-muted-foreground)]">{t.shopEmpty}</p>
      )}
    </AdminHubMetricCard>
  );
}

export function AdminHubHomeChangelogCard({
  dict,
  entries,
}: {
  dict: Dictionary;
  entries: AdminHomeExtraWidgets["changelog"];
}) {
  const t = dict.admin.home.layout.widgets;
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h3 className="text-base font-semibold text-[var(--color-foreground)]">{t.changelogTitle}</h3>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{t.changelogEmpty}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <p className="text-sm font-medium text-[var(--color-foreground)]">{entry.title}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">{entry.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function AdminHubHomeShortcutsSlot({
  base,
  dict,
  includeBlog,
}: {
  base: string;
  dict: Dictionary;
  includeBlog: boolean;
}) {
  return <AdminHubHomeBoost base={base} dict={dict} includeBlog={includeBlog} />;
}

import {
  Armchair,
  CalendarCheck,
  Hourglass,
  Mail,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { AdminHomeOpsSnapshot } from "@/lib/dashboard/parseAdminHomeOpsSnapshot";
import type { AdminHomeWidgetId } from "@/lib/dashboard/adminHomeLayout";
import { AdminHubMetricCard } from "@/components/dashboard/AdminHubMetricCard";

const iconClass =
  "bg-[color-mix(in_srgb,var(--color-primary)_12%,white)] text-[var(--color-primary)]";

function fill(template: string | undefined, values: Record<string, number | string>): string {
  return Object.entries(values).reduce(
    (line, [key, value]) => line.replaceAll(`{{${key}}}`, String(value)),
    template ?? "",
  );
}

function line(text: string) {
  return <p className="truncate text-xs text-[var(--color-muted-foreground)]">{text}</p>;
}

export function AdminHubHomeOpsCard({
  id,
  base,
  dict,
  ops,
}: {
  id: AdminHomeWidgetId;
  base: string;
  dict: Dictionary;
  ops: AdminHomeOpsSnapshot;
}) {
  const t = dict.admin.home.layout.widgets;
  if (id === "emailQuota") {
    const label = fill(t.emailQuotaLine, { used: ops.emailUsed, cap: ops.emailCap });
    return (
      <AdminHubMetricCard
        compact
        href={`${base}/settings`}
        icon={<Mail className="h-4 w-4" aria-hidden />}
        title={t.emailQuotaTitle}
        linkLabel={t.emailQuotaOpen}
        hint={t.about.emailQuota}
        accentClass={iconClass}
      >
        <p className="text-sm font-semibold text-[var(--color-foreground)]">{label}</p>
        <progress
          className="mt-2 h-2 w-full accent-[var(--color-primary)]"
          max={ops.emailCap}
          value={Math.min(ops.emailUsed, ops.emailCap)}
          aria-label={label}
        />
      </AdminHubMetricCard>
    );
  }
  if (id === "cohortEnrollments") {
    const href = ops.cohort ? `${base}/academic/${ops.cohort.id}` : `${base}/academic`;
    return (
      <AdminHubMetricCard
        compact
        href={href}
        icon={<Users className="h-4 w-4" aria-hidden />}
        title={t.cohortEnrollmentsTitle}
        linkLabel={t.cohortEnrollmentsOpen}
        hint={t.about.cohortEnrollments}
        accentClass={iconClass}
      >
        {ops.cohort
          ? line(`${ops.cohort.name} · ${fill(t.cohortEnrollmentsLine, { count: ops.cohort.activeEnrollments })}`)
          : line(t.cohortEnrollmentsEmpty)}
      </AdminHubMetricCard>
    );
  }
  if (id === "classesToday") {
    const text = !ops.cohort
      ? t.classesTodayEmpty
      : ops.classesMeeting === 0
        ? t.classesTodayNone
        : fill(t.classesTodayLine, { meeting: ops.classesMeeting, missing: ops.classesMissingAttendance });
    return (
      <AdminHubMetricCard
        compact
        href={`${base}/calendar`}
        icon={<CalendarCheck className="h-4 w-4" aria-hidden />}
        title={t.classesTodayTitle}
        linkLabel={t.classesTodayOpen}
        hint={t.about.classesToday}
        accentClass={iconClass}
      >
        {line(text)}
      </AdminHubMetricCard>
    );
  }
  if (id === "trialsThisWeek") {
    return (
      <AdminHubMetricCard
        compact
        href={`${base}/registrations`}
        icon={<Ticket className="h-4 w-4" aria-hidden />}
        title={t.trialsTitle}
        linkLabel={t.trialsOpen}
        hint={t.about.trialsThisWeek}
        accentClass={iconClass}
      >
        {line(fill(t.trialsLine, { booked: ops.trialsBooked, attended: ops.trialsAttended, released: ops.trialsReleased }))}
      </AdminHubMetricCard>
    );
  }
  if (id === "sectionSeats") {
    const href = ops.cohort ? `${base}/academic/${ops.cohort.id}` : `${base}/academic`;
    return (
      <AdminHubMetricCard
        compact
        href={href}
        icon={<Armchair className="h-4 w-4" aria-hidden />}
        title={t.sectionSeatsTitle}
        linkLabel={t.sectionSeatsOpen}
        hint={t.about.sectionSeats}
        accentClass={iconClass}
      >
        {ops.cohort
          ? line(fill(t.sectionSeatsLine, { full: ops.sectionsFull, oneLeft: ops.sectionsOneLeft }))
          : line(t.sectionSeatsEmpty)}
      </AdminHubMetricCard>
    );
  }
  if (id === "eventWaitlist") {
    return (
      <AdminHubMetricCard
        compact
        href={`${base}/events`}
        icon={<Hourglass className="h-4 w-4" aria-hidden />}
        title={t.waitlistTitle}
        linkLabel={t.waitlistOpen}
        hint={t.about.eventWaitlist}
        accentClass={iconClass}
      >
        {line(ops.waitlistTotal > 0 ? fill(t.waitlistLine, { count: ops.waitlistTotal }) : t.waitlistEmpty)}
      </AdminHubMetricCard>
    );
  }
  if (id === "eventPaymentsReview") {
    return (
      <AdminHubMetricCard
        compact
        href={`${base}/finance`}
        icon={<Wallet className="h-4 w-4" aria-hidden />}
        title={t.eventPaymentsTitle}
        linkLabel={t.eventPaymentsOpen}
        hint={t.about.eventPaymentsReview}
        accentClass={iconClass}
      >
        {line(
          ops.eventPaymentsPendingReview > 0
            ? fill(t.eventPaymentsLine, { count: ops.eventPaymentsPendingReview })
            : t.eventPaymentsEmpty,
        )}
      </AdminHubMetricCard>
    );
  }
  return null;
}

import Link from "next/link";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import {
  sectionStaffAssignedBadgeKey,
  type SectionStaffAssignedPerson,
} from "@/lib/academics/sectionStaffAssignedPerson";

export interface AcademicSectionStaffPersonCardDict {
  leadBadge: string;
  assistantBadge: string;
  assistantBadgeTeacher: string;
  assistantBadgeStudent: string;
  assistantBadgePortalAssistant: string;
  openProfileAria: string;
  phoneLabel: string;
  documentLabel: string;
  emailLabel: string;
}

export interface AcademicSectionStaffPersonCardProps {
  locale: string;
  person: SectionStaffAssignedPerson;
  dict: AcademicSectionStaffPersonCardDict;
}

const badgeClass =
  "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide";

export function AcademicSectionStaffPersonCard({
  locale,
  person,
  dict,
}: AcademicSectionStaffPersonCardProps) {
  const badgeKey = sectionStaffAssignedBadgeKey(person);
  const badgeLabel = dict[badgeKey];
  const isLead = person.kind === "lead";
  const aria = dict.openProfileAria.replaceAll("{name}", person.label);
  const href = `/${locale}/dashboard/admin/users/${person.id}`;

  return (
    <li className="min-w-0">
      <Link
        href={href}
        aria-label={aria}
        title={aria}
        className="flex items-start gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <ProfileAvatar url={person.avatarDisplayUrl} displayName={person.label} size="lg" />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium text-[var(--color-foreground)]">{person.label}</span>
            <span
              className={
                isLead
                  ? `${badgeClass} border-[var(--color-primary)]/50 bg-[var(--color-primary)]/10 text-[var(--color-primary)]`
                  : `${badgeClass} border-[var(--color-border)] bg-[var(--color-muted)]/30 text-[var(--color-muted-foreground)]`
              }
            >
              {badgeLabel}
            </span>
          </div>
          <dl className="space-y-0.5 text-xs text-[var(--color-muted-foreground)]">
            {person.email ? (
              <div className="flex min-w-0 flex-wrap gap-x-1">
                <dt className="sr-only">{dict.emailLabel}</dt>
                <dd className="truncate break-all">{person.email}</dd>
              </div>
            ) : null}
            {person.phone ? (
              <div className="flex min-w-0 flex-wrap gap-x-1">
                <dt className="font-medium text-[var(--color-foreground)]/80">{dict.phoneLabel}:</dt>
                <dd className="truncate">{person.phone}</dd>
              </div>
            ) : null}
            {person.dniOrPassport ? (
              <div className="flex min-w-0 flex-wrap gap-x-1">
                <dt className="font-medium text-[var(--color-foreground)]/80">{dict.documentLabel}:</dt>
                <dd className="truncate">{person.dniOrPassport}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      </Link>
    </li>
  );
}

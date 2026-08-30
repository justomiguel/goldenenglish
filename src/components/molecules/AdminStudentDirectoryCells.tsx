import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserRow } from "@/lib/dashboard/adminUsersTableHelpers";
import {
  adminAcademicSectionHref,
  type AdminStudentDirectorySection,
} from "@/lib/dashboard/loadAdminStudentDirectoryExtras";
import { formatMonthlyDueTotals } from "@/lib/billing/sumDiscountedMonthlyDue";
import { DirectoryBillingMark } from "@/components/molecules/DirectoryBillingMark";
import {
  formatDirectoryLastEnrollment,
  type DirectoryBillingMark as BillingMark,
} from "@/lib/dashboard/directoryBillingStatus";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

type UserLabels = Dictionary["admin"]["users"];

function sectionChipClassName(clickable: boolean): string {
  return `inline-flex max-w-full flex-wrap items-center gap-1 break-words rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs font-medium ${
    clickable
      ? "text-[var(--color-primary)] hover:underline"
      : "text-[var(--color-foreground)]"
  }`;
}

function SectionDiscountMark({ percent }: { percent: number | null }) {
  if (percent == null || !Number.isFinite(percent) || percent <= 0) return null;
  return (
    <span className="inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-emerald-800">
      {percent}%
    </span>
  );
}

function DirectorySectionChip({
  section,
  locale,
  labels,
}: {
  section: AdminStudentDirectorySection;
  locale: string;
  labels: UserLabels;
}) {
  const href = adminAcademicSectionHref(locale, section);
  const discount = <SectionDiscountMark percent={section.discountPercent} />;
  if (!href) {
    return (
      <span className={sectionChipClassName(false)}>
        {section.name}
        {discount}
      </span>
    );
  }
  return (
    <Link
      href={href}
      title={labels.tipOpenAcademicSection}
      className={sectionChipClassName(true)}
    >
      {section.name}
      {discount}
    </Link>
  );
}

export function AdminStudentSectionsList({
  row,
  locale,
  labels,
  emptyValue,
}: {
  row: AdminUserRow;
  locale: string;
  labels: UserLabels;
  emptyValue: string;
}) {
  if (row.sections.length === 0) {
    return <span className="text-[var(--color-muted-foreground)]">{emptyValue}</span>;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {row.sections.map((section) => (
        <DirectorySectionChip
          key={section.id}
          section={section}
          locale={locale}
          labels={labels}
        />
      ))}
    </span>
  );
}

export function AdminStudentMonthlyDueCell({
  row,
  locale,
  labels,
  emptyValue,
}: {
  row: AdminUserRow;
  locale: string;
  labels: UserLabels;
  emptyValue: string;
}) {
  const formatted = formatMonthlyDueTotals(row.monthlyDue, locale);
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {formatted ? (
        <span className="font-semibold tabular-nums text-[var(--color-foreground)]">{formatted}</span>
      ) : (
        <span className="text-[var(--color-muted-foreground)]">{emptyValue}</span>
      )}
      <DirectoryBillingMark
        status={row.monthlyStatus}
        yesLabel={labels.billingMarkYes}
        noLabel={labels.billingMarkNo}
        yesTitle={labels.monthlyStatusYesAria}
        noTitle={labels.monthlyStatusNoAria}
        naTitle={labels.monthlyStatusNaAria}
      />
    </span>
  );
}

export function AdminDirectoryMonthlyStatusCell({
  status,
  labels,
}: {
  status: BillingMark;
  labels: UserLabels;
}) {
  return (
    <DirectoryBillingMark
      status={status}
      yesLabel={labels.billingMarkYes}
      noLabel={labels.billingMarkNo}
      yesTitle={labels.monthlyStatusYesAria}
      noTitle={labels.monthlyStatusNoAria}
      naTitle={labels.monthlyStatusNaAria}
    />
  );
}

export function AdminDirectoryEnrollmentFeeCell({
  status,
  labels,
}: {
  status: BillingMark;
  labels: UserLabels;
}) {
  return (
    <DirectoryBillingMark
      status={status}
      yesLabel={labels.billingMarkYes}
      noLabel={labels.billingMarkNo}
      yesTitle={labels.enrollmentFeeYesAria}
      noTitle={labels.enrollmentFeeNoAria}
      naTitle={labels.enrollmentFeeNaAria}
    />
  );
}

export function AdminDirectoryLastEnrollmentCell({
  iso,
  locale,
  emptyValue,
}: {
  iso: string | null;
  locale: string;
  emptyValue: string;
}) {
  const label = formatDirectoryLastEnrollment(iso, locale, emptyValue);
  return (
    <span className={iso ? "text-[var(--color-foreground)]" : "text-[var(--color-muted-foreground)]"}>
      {label}
    </span>
  );
}

export function AdminStudentParentsList({
  row,
  locale,
  labels,
  emptyValue,
}: {
  row: AdminUserRow;
  locale: string;
  labels: UserLabels;
  emptyValue: string;
}) {
  if (row.parents.length === 0) {
    return <span className="text-[var(--color-muted-foreground)]">{emptyValue}</span>;
  }
  return (
    <span className="flex flex-col items-start gap-1">
      {row.parents.map((parent) => {
        const name = formatProfileNameSurnameFirst(parent.firstName, parent.lastName, emptyValue);
        return (
          <Link
            key={parent.id}
            href={`/${locale}/dashboard/admin/users/${parent.id}`}
            title={labels.tipOpenParentProfile}
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            {name}
          </Link>
        );
      })}
    </span>
  );
}

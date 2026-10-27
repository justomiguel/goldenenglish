import Link from "next/link";
import { useState } from "react";
import { Eye, Loader2, Trash2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { adminUserRowAriaName, type AdminUserRow } from "@/lib/dashboard/adminUsersTableHelpers";
import { Button } from "@/components/atoms/Button";
import { AdminDirectoryMonthlyStatusCell } from "@/components/molecules/AdminStudentDirectoryCells";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";

type UserLabels = Dictionary["admin"]["users"];

function metaLine(parts: Array<string | null | undefined>): string {
  return parts.filter((part) => part && part.trim().length > 0).join(" · ");
}

export function AdminUsersPwaListItem(props: {
  locale: string;
  labels: UserLabels;
  row: AdminUserRow;
  currentUserId: string;
  selected: boolean;
  busy: boolean;
  studentsDirectory: boolean;
  teachersDirectory: boolean;
  parentsDirectory?: boolean;
  emptyValue: string;
  onToggleRow: (id: string) => void;
  onRequestDeleteOne: (id: string) => void;
}) {
  const { row: r, labels, locale } = props;
  const [opening, setOpening] = useState(false);
  const isSelf = r.id === props.currentUserId;
  const ariaName = props.studentsDirectory ? adminUserRowAriaName(r) : r.email;
  const name = formatProfileNameSurnameFirst(r.firstName, r.lastName);
  const sectionNames = r.sections.map((section) => section.name).join(", ");
  const guardian = r.parents[0]
    ? formatProfileNameSurnameFirst(r.parents[0].firstName, r.parents[0].lastName)
    : null;
  const children = r.children
    .map((child) => formatProfileNameSurnameFirst(child.firstName, child.lastName))
    .join(", ");
  const summary = props.studentsDirectory
    ? metaLine([sectionNames || labels.noSectionBadge, guardian, r.phone || r.email])
    : props.parentsDirectory
      ? metaLine([children, r.phone || r.email])
      : props.teachersDirectory
        ? metaLine([sectionNames, r.phone || r.email])
        : metaLine([r.email, r.phone]);
  const feeAlert = r.enrollmentFeeStatus === "no" ? labels.colEnrollmentFee : r.missingSection ? labels.noSectionBadge : null;

  return (
    <li
      aria-busy={opening || undefined}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 shadow-[var(--shadow-soft)]"
    >
      <div className="flex items-start gap-2">
        <label className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-[var(--color-border)]"
            checked={props.selected}
            disabled={isSelf}
            onChange={() => props.onToggleRow(r.id)}
            aria-label={`${labels.selectRow} ${ariaName}`}
            title={isSelf ? labels.selfProtected : labels.tipSelectRow}
          />
        </label>
        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link
              href={`/${locale}/dashboard/admin/users/${r.id}`}
              title={labels.tipOpenUserProfile}
              aria-busy={opening || undefined}
              onClick={() => setOpening(true)}
              className="inline-flex min-w-0 items-center gap-1.5 break-words text-base font-semibold leading-snug text-[var(--color-primary)]"
            >
              {opening ? <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden /> : null}
              {opening ? <span className="sr-only">{labels.openingProfile}</span> : null}
              {name}
            </Link>
            {props.studentsDirectory || props.parentsDirectory ? (
              <AdminDirectoryMonthlyStatusCell status={r.monthlyStatus} labels={labels} />
            ) : (
              <span className="shrink-0 rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[0.65rem] font-semibold capitalize text-[var(--color-foreground)]">
                {r.role}
              </span>
            )}
          </div>
          <p className="mt-1 line-clamp-2 break-words text-xs leading-relaxed text-[var(--color-muted-foreground)] sm:text-sm">
            {summary || props.emptyValue}
          </p>
          {feeAlert ? (
            <p className="mt-1 truncate text-[11px] font-medium text-[var(--color-foreground)]">{feeAlert}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center">
          <Link
            href={`/${locale}/dashboard/admin/users/${r.id}`}
            title={labels.tipViewOne}
            aria-label={`${labels.viewOne}: ${ariaName}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
            onClick={() => setOpening(true)}
          >
            <Eye className="h-4 w-4" aria-hidden />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-11 min-w-11 shrink-0 gap-0 p-2 text-[var(--color-error)]"
            disabled={isSelf || props.busy}
            title={isSelf ? labels.selfProtected : labels.tipDeleteOneRow}
            onClick={() => props.onRequestDeleteOne(r.id)}
            aria-label={`${labels.deleteOne}: ${ariaName}`}
          >
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
        </div>
      </div>
    </li>
  );
}

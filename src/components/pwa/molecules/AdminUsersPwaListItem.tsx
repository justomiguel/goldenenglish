import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import {
  adminUserRowAriaName,
  type AdminUserRow,
} from "@/lib/dashboard/adminUsersTableHelpers";
import { Button } from "@/components/atoms/Button";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import {
  AdminStudentMonthlyDueCell,
  AdminStudentParentsList,
  AdminStudentSectionsList,
} from "@/components/molecules/AdminStudentDirectoryCells";
import { formatProfileNameSurnameFirst } from "@/lib/profile/formatProfileDisplayName";
import { formatParentLastAccess } from "@/lib/parents/formatParentLastAccess";

type UserLabels = Dictionary["admin"]["users"];

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
  const isSelf = r.id === props.currentUserId;
  const ariaName = props.studentsDirectory ? adminUserRowAriaName(r) : r.email;
  return (
    <li className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 shadow-[var(--shadow-soft)]">
      <div className="flex gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-[var(--color-border)]"
          checked={props.selected}
          disabled={isSelf}
          onChange={() => props.onToggleRow(r.id)}
          aria-label={`${labels.selectRow} ${ariaName}`}
          title={isSelf ? labels.selfProtected : labels.tipSelectRow}
        />
        <div className="min-w-0 flex-1 space-y-1">
          {props.studentsDirectory || props.parentsDirectory ? null : (
            <p className="break-all font-medium text-[var(--color-foreground)]">{r.email}</p>
          )}
          <Link
            href={`/${locale}/dashboard/admin/users/${r.id}`}
            title={labels.tipOpenUserProfile}
            className="flex items-start gap-2 text-sm text-[var(--color-muted-foreground)] active:opacity-80"
          >
            <ProfileAvatar
              url={r.avatarDisplayUrl}
              displayName={formatProfileNameSurnameFirst(r.firstName, r.lastName)}
              size="sm"
            />
            <span className="flex min-w-0 flex-wrap items-center gap-1.5 break-words font-medium text-[var(--color-foreground)]">
              <span>{formatProfileNameSurnameFirst(r.firstName, r.lastName)}</span>
              {r.missingSection ? (
                <span
                  className="inline-flex shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-sky-800"
                  title={labels.noSectionBadgeAria}
                >
                  {labels.noSectionBadge}
                </span>
              ) : null}
            </span>
          </Link>
          {props.studentsDirectory ? (
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-[var(--color-muted-foreground)]">{labels.colSections}: </span>
                <AdminStudentSectionsList
                  row={r}
                  locale={locale}
                  labels={labels}
                  emptyValue={props.emptyValue}
                />
              </div>
              <div>
                <span className="text-[var(--color-muted-foreground)]">{labels.colMonthlyDue}: </span>
                <AdminStudentMonthlyDueCell row={r} locale={locale} emptyValue={props.emptyValue} />
              </div>
              <div>
                <span className="text-[var(--color-muted-foreground)]">{labels.colParent}: </span>
                <AdminStudentParentsList
                  row={r}
                  locale={locale}
                  labels={labels}
                  emptyValue={props.emptyValue}
                />
              </div>
            </div>
          ) : props.parentsDirectory ? (
            <div className="space-y-1 text-sm">
              <p>{r.emailDeliverable ? r.email : labels.noDeliverableEmail}</p>
              <p>
                <span className="text-[var(--color-muted-foreground)]">{labels.colLastAccess}: </span>
                {formatParentLastAccess(r.lastSessionStartAt, locale, labels.lastAccessNever)}
              </p>
              <div>
                <span className="text-[var(--color-muted-foreground)]">{labels.colSections}: </span>
                <AdminStudentSectionsList
                  row={r}
                  locale={locale}
                  labels={labels}
                  emptyValue={props.emptyValue}
                />
              </div>
            </div>
          ) : props.teachersDirectory ? (
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-[var(--color-muted-foreground)]">{labels.colSections}: </span>
                <AdminStudentSectionsList
                  row={r}
                  locale={locale}
                  labels={labels}
                  emptyValue={props.emptyValue}
                />
              </div>
              <span className="text-[var(--color-muted-foreground)]">{r.phone}</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="capitalize text-[var(--color-foreground)]">{r.role}</span>
              <span className="text-[var(--color-muted-foreground)]">{r.phone}</span>
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <Link
            href={`/${locale}/dashboard/admin/users/${r.id}`}
            title={labels.tipViewOne}
            aria-label={`${labels.viewOne}: ${ariaName}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,white)]"
          >
            <Eye className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={`/${locale}/dashboard/admin/users/${r.id}`}
            title={labels.tipEditOne}
            aria-label={`${labels.editOne}: ${ariaName}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] shrink-0 gap-0 p-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
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

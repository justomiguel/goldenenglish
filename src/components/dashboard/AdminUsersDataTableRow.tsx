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

export function AdminUsersDataTableRow(props: {
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
    <tr className="border-b border-[var(--color-border)] last:border-0">
      <td className="px-2 py-2 align-middle">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-[var(--color-border)]"
          checked={props.selected}
          disabled={isSelf}
          onChange={() => props.onToggleRow(r.id)}
          aria-label={`${labels.selectRow} ${ariaName}`}
          title={isSelf ? labels.selfProtected : labels.tipSelectRow}
        />
      </td>
      {props.studentsDirectory || props.parentsDirectory ? null : (
        <td className="min-w-0 max-w-0 break-words px-2 py-2 align-top">
          <Link
            href={`/${locale}/dashboard/admin/users/${r.id}`}
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            {r.email}
          </Link>
        </td>
      )}
      <td className="min-w-0 px-2 py-2 align-top">
        <Link
          href={`/${locale}/dashboard/admin/users/${r.id}`}
          title={labels.tipOpenUserProfile}
          className="flex items-start gap-2 text-[var(--color-foreground)] hover:underline"
        >
          <ProfileAvatar
            url={r.avatarDisplayUrl}
            displayName={formatProfileNameSurnameFirst(r.firstName, r.lastName)}
            size="sm"
          />
          <span className="flex min-w-0 flex-wrap items-center gap-1.5 break-words">
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
      </td>
      {props.studentsDirectory ? (
        <>
          <td className="min-w-0 break-words px-2 py-2 align-top">
            <AdminStudentSectionsList
              row={r}
              locale={locale}
              labels={labels}
              emptyValue={props.emptyValue}
            />
          </td>
          <td className="min-w-0 break-words px-2 py-2 align-top">
            <AdminStudentMonthlyDueCell row={r} locale={locale} emptyValue={props.emptyValue} />
          </td>
          <td className="min-w-0 break-words px-2 py-2 align-top">
            <AdminStudentParentsList
              row={r}
              locale={locale}
              labels={labels}
              emptyValue={props.emptyValue}
            />
          </td>
        </>
      ) : props.parentsDirectory ? (
        <>
          <td className="min-w-0 max-w-0 break-words px-2 py-2 align-top">
            {r.emailDeliverable ? r.email : labels.noDeliverableEmail}
          </td>
          <td className="min-w-0 break-words px-2 py-2 align-top">
            {r.children.length === 0
              ? props.emptyValue
              : r.children.map((c) => (
                  <Link
                    key={c.id}
                    href={`/${locale}/dashboard/admin/users/${c.id}`}
                    className="mr-2 text-[var(--color-primary)] hover:underline"
                  >
                    {formatProfileNameSurnameFirst(c.firstName, c.lastName)}
                  </Link>
                ))}
          </td>
          <td className="min-w-0 break-words px-2 py-2 align-top">
            <AdminStudentSectionsList
              row={r}
              locale={locale}
              labels={labels}
              emptyValue={props.emptyValue}
            />
          </td>
          <td className="min-w-0 break-words px-2 py-2 align-top text-[var(--color-foreground)]">
            {formatParentLastAccess(r.lastSessionStartAt, locale, labels.lastAccessNever)}
          </td>
        </>
      ) : props.teachersDirectory ? (
        <>
          <td className="min-w-0 break-words px-2 py-2 align-top">
            <AdminStudentSectionsList
              row={r}
              locale={locale}
              labels={labels}
              emptyValue={props.emptyValue}
            />
          </td>
          <td className="min-w-0 break-words px-2 py-2 align-top text-[var(--color-foreground)]">
            {r.phone}
          </td>
        </>
      ) : (
        <>
          <td className="min-w-0 break-words px-2 py-2 align-top">
            <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold capitalize text-sky-800">
              {r.role}
            </span>
          </td>
          <td className="min-w-0 break-words px-2 py-2 align-top text-[var(--color-foreground)]">
            {r.phone}
          </td>
        </>
      )}
      <td className="min-w-0 px-2 py-2 align-top whitespace-nowrap">
        <div className="flex items-center gap-1">
          <Link
            href={`/${locale}/dashboard/admin/users/${r.id}`}
            title={labels.tipViewOne}
            aria-label={`${labels.viewOne}: ${ariaName}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-primary)] hover:bg-[color-mix(in_srgb,var(--color-primary)_10%,white)]"
          >
            <Eye className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href={`/${locale}/dashboard/admin/users/${r.id}`}
            title={labels.tipEditOne}
            aria-label={`${labels.editOne}: ${ariaName}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
          >
            <Pencil className="h-4 w-4" aria-hidden />
          </Link>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 w-10 min-h-10 rounded-xl p-0 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
            disabled={isSelf || props.busy}
            title={isSelf ? labels.selfProtected : labels.tipDeleteOneRow}
            onClick={() => props.onRequestDeleteOne(r.id)}
            aria-label={`${labels.deleteOne}: ${ariaName}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </td>
    </tr>
  );
}

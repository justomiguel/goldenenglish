"use client";

import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import { AdminUserAvatarUploadForm } from "@/components/molecules/AdminUserAvatarUploadForm";
import { useAvatarUploadPreview } from "@/hooks/useAvatarUploadPreview";
import { StudentCareBadge } from "@/components/molecules/StudentCareBadge";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserIdentityHeroProps {
  locale: string;
  detail: AdminUserDetailVM;
  labels: UserLabels;
  fileUploadProgress: FileUploadProgressLabels;
  displayName: string;
  roleLabel: string;
}

export function AdminUserIdentityHero({
  locale,
  detail,
  labels,
  fileUploadProgress,
  displayName,
  roleLabel,
}: AdminUserIdentityHeroProps) {
  const { resolvedAvatarUrl, setPreviewFromFile } = useAvatarUploadPreview(detail.avatarDisplayUrl);
  const canChangeStudentAvatar = detail.role === "student" && detail.viewerMayInlineEdit;

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)] sm:p-5">
      <div className="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:gap-5">
        <div className="relative w-fit">
          <div className="inline-flex rounded-full bg-[var(--color-background)] p-1 shadow-[var(--shadow-soft)] ring-1 ring-[var(--color-border)]">
            <ProfileAvatar
              key={resolvedAvatarUrl ?? "none"}
              url={resolvedAvatarUrl}
              displayName={displayName}
              size="lg"
            />
          </div>
          {canChangeStudentAvatar ? (
            <div className="absolute -bottom-1 -left-1">
              <AdminUserAvatarUploadForm
                locale={locale}
                targetUserId={detail.userId}
                labels={labels}
                fileUploadProgress={fileUploadProgress}
                onPreview={setPreviewFromFile}
              />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-3 sm:space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className="break-words font-display text-xl font-bold leading-tight text-[var(--color-primary)] sm:text-2xl"
                data-tour={ADMIN_TOUR_ANCHORS.userDetailTitle}
              >
                {displayName}
              </h1>
              <span className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                {roleLabel}
              </span>
              {detail.hasCareNotes ? <StudentCareBadge label={labels.detailCareBadge} /> : null}
            </div>
            <p className="mt-1 break-all text-sm text-[var(--color-muted-foreground)]">{detail.emailDisplay}</p>
          </div>
          <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
            <div className="col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 sm:col-span-1 sm:rounded-2xl sm:p-3">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] sm:text-xs">
                {labels.detailIdentityRoleLabel}
              </dt>
              <dd className="mt-0.5 text-sm font-semibold text-[var(--color-foreground)] sm:mt-1">{roleLabel}</dd>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 sm:rounded-2xl sm:p-3">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] sm:text-xs">
                {labels.detailFieldDni}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-[var(--color-foreground)] sm:mt-1">
                {detail.dniOrPassport || labels.detailNoValue}
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5 sm:rounded-2xl sm:p-3">
              <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--color-muted-foreground)] sm:text-xs">
                {labels.detailIdentitySinceLabel}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-[var(--color-foreground)] sm:mt-1">
                {detail.createdAtDisplay}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

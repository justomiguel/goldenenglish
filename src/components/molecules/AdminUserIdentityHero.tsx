"use client";

import type { Dictionary } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import { AdminUserAvatarUploadForm } from "@/components/molecules/AdminUserAvatarUploadForm";
import { useAvatarUploadPreview } from "@/hooks/useAvatarUploadPreview";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserIdentityHeroProps {
  locale: string;
  detail: AdminUserDetailVM;
  labels: UserLabels;
  displayName: string;
  roleLabel: string;
}

export function AdminUserIdentityHero({
  locale,
  detail,
  labels,
  displayName,
  roleLabel,
}: AdminUserIdentityHeroProps) {
  const { resolvedAvatarUrl, setPreviewFromFile } = useAvatarUploadPreview(detail.avatarDisplayUrl);
  const canChangeStudentAvatar = detail.role === "student" && detail.viewerMayInlineEdit;

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
        <div className="relative w-fit">
          <div className="inline-flex rounded-full bg-[var(--color-surface)] p-1 shadow-[var(--shadow-card)] ring-1 ring-[var(--color-border)]">
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
                onPreview={setPreviewFromFile}
              />
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words font-display text-2xl font-bold leading-tight text-[var(--color-secondary)]">
                {displayName}
              </h1>
              <span className="rounded-full border border-[color-mix(in_srgb,var(--color-accent)_30%,var(--color-border))] bg-[var(--color-background)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                {roleLabel}
              </span>
            </div>
            <p className="mt-1 break-all text-sm text-[var(--color-muted-foreground)]">{detail.emailDisplay}</p>
          </div>
          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {labels.detailIdentityRoleLabel}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">{roleLabel}</dd>
            </div>
            <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {labels.detailFieldDni}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
                {detail.dniOrPassport || labels.detailNoValue}
              </dd>
            </div>
            <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {labels.detailIdentitySinceLabel}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
                {detail.createdAtDisplay}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}

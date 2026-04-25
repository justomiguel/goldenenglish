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
    <section className="relative overflow-hidden rounded-[calc(var(--layout-border-radius)*1.35)] border border-[color-mix(in_srgb,var(--color-accent)_24%,var(--color-border))] bg-[var(--color-surface)] shadow-[var(--shadow-card)]">
      <div
        className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_20%_0%,color-mix(in_srgb,var(--color-accent)_28%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_18%,transparent),color-mix(in_srgb,var(--color-secondary)_14%,transparent))]"
        aria-hidden
      />
      <div className="relative grid gap-5 p-5 pt-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6">
        <div className="space-y-3">
          <div className="inline-flex rounded-full bg-[var(--color-surface)] p-1.5 shadow-[var(--shadow-card)] ring-4 ring-[color-mix(in_srgb,var(--color-surface)_88%,transparent)]">
            <ProfileAvatar
              key={resolvedAvatarUrl ?? "none"}
              url={resolvedAvatarUrl}
              displayName={displayName}
              size="lg"
            />
          </div>
          {canChangeStudentAvatar ? (
            <AdminUserAvatarUploadForm
              locale={locale}
              targetUserId={detail.userId}
              labels={labels}
              onPreview={setPreviewFromFile}
            />
          ) : null}
        </div>

        <div className="min-w-0 space-y-5 pt-16 sm:pt-14">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="break-words font-display text-3xl font-bold leading-tight text-[var(--color-secondary)]">
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

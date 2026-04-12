"use client";

import type { Dictionary } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserDetailPanelProps {
  detail: AdminUserDetailVM;
  labels: UserLabels;
}

function Field({
  label,
  value,
  valueClassName = "",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="border-b border-[var(--color-border)] py-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {label}
      </dt>
      <dd className={`mt-1 text-sm text-[var(--color-foreground)] ${valueClassName}`}>{value}</dd>
    </div>
  );
}

export function AdminUserDetailPanel({ detail, labels }: AdminUserDetailPanelProps) {
  const displayName = `${detail.firstName} ${detail.lastName}`.trim() || detail.email;
  const showTeacher = detail.role === "student";

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <ProfileAvatar
          url={detail.avatarDisplayUrl}
          displayName={displayName}
          size="lg"
          className="mx-auto sm:mx-0"
        />
        <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
          <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)]">{displayName}</h1>
        </div>
      </div>

      <dl className="mt-8">
        <Field label={labels.detailFieldEmail} value={detail.email} />
        <Field label={labels.detailFieldDni} value={detail.dniOrPassport} />
        <Field label={labels.detailFieldPhone} value={detail.phone} />
        <Field label={labels.detailFieldRole} value={detail.role} valueClassName="capitalize" />
        <Field
          label={labels.detailFieldBirth}
          value={detail.birthDateDisplay ?? labels.detailNoValue}
        />
        <Field
          label={labels.detailFieldAge}
          value={detail.ageYears != null ? String(detail.ageYears) : labels.detailNoValue}
        />
        {showTeacher ? (
          <Field
            label={labels.detailFieldTeacher}
            value={detail.assignedTeacherName ?? labels.detailNoValue}
          />
        ) : null}
        <Field label={labels.detailFieldCreated} value={detail.createdAtDisplay} />
      </dl>
    </div>
  );
}

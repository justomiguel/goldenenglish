"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import type { Dictionary } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import { AdminUserInlineEditableField } from "@/components/molecules/AdminUserInlineEditableField";
import { AdminUserDetailPasswordSection } from "@/components/molecules/AdminUserDetailPasswordSection";
import { AdminUserDetailTutorCard } from "@/components/molecules/AdminUserDetailTutorCard";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserProfileFichaProps {
  locale: string;
  labels: UserLabels;
  detail: AdminUserDetailVM;
}

function CardShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="border-b border-[var(--color-border)] pb-3 font-display text-lg font-semibold text-[var(--color-secondary)]">{title}</h2>
      <dl className="mt-4">{children}</dl>
    </section>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-[var(--color-border)] py-3 last:border-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className="mt-1 text-sm text-[var(--color-foreground)]">{value}</dd>
    </div>
  );
}

export function AdminUserProfileFicha({ locale, labels, detail }: AdminUserProfileFichaProps) {
  const ed = detail.viewerMayInlineEdit;
  const displayName = `${detail.firstName} ${detail.lastName}`.trim() || detail.emailDisplay;
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const onFeedback = useCallback((text: string, ok: boolean) => {
    setToast({ text, ok });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(t);
  }, [toast]);

  const roleOptions = [
    { value: "admin", label: labels.roleOptionAdmin },
    { value: "teacher", label: labels.roleOptionTeacher },
    { value: "student", label: labels.roleOptionStudent },
    { value: "parent", label: labels.roleOptionParent },
    { value: "assistant", label: labels.roleOptionAssistant },
  ];

  const showFamilyCard = detail.role === "student" && (detail.isMinor || detail.tutorLinks.length > 0);
  const roleLabel = roleOptions.find((o) => o.value === detail.role)?.label ?? detail.role;

  return (
    <div className="space-y-4">
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className={`rounded-[var(--layout-border-radius)] border px-4 py-3 text-sm ${
            toast.ok
              ? "border-[var(--color-primary)]/40 bg-[var(--color-muted)]/40 text-[var(--color-foreground)]"
              : "border-[var(--color-error)]/50 bg-[var(--color-muted)]/30 text-[var(--color-error)]"
          }`}
        >
          {toast.text}
        </div>
      ) : null}

      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <ProfileAvatar url={detail.avatarDisplayUrl} displayName={displayName} size="lg" className="mx-auto sm:mx-0" />
          <div className="min-w-0 flex-1 space-y-1 text-center sm:text-left">
            <h1 className="font-display text-2xl font-bold text-[var(--color-secondary)]">{displayName}</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">{detail.emailDisplay}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <CardShell title={labels.detailCardContact}>
          <AdminUserInlineEditableField
            locale={locale}
            userId={detail.userId}
            field="firstName"
            label={labels.detailFieldFirstName}
            displayValue={detail.firstName || labels.detailNoValue}
            editInitial={detail.firstName}
            editable={ed}
            inputKind="text"
            labels={labels}
            onFeedback={onFeedback}
          />
          <AdminUserInlineEditableField
            locale={locale}
            userId={detail.userId}
            field="lastName"
            label={labels.detailFieldLastName}
            displayValue={detail.lastName || labels.detailNoValue}
            editInitial={detail.lastName}
            editable={ed}
            inputKind="text"
            labels={labels}
            onFeedback={onFeedback}
          />
          <AdminUserInlineEditableField
            locale={locale}
            userId={detail.userId}
            field="email"
            label={labels.detailFieldEmail}
            displayValue={detail.emailDisplay}
            editInitial={detail.email}
            editable={ed}
            inputKind="email"
            labels={labels}
            onFeedback={onFeedback}
          />
          <AdminUserInlineEditableField
            locale={locale}
            userId={detail.userId}
            field="phone"
            label={labels.detailFieldPhone}
            displayValue={detail.phoneDisplay}
            editInitial={detail.phone}
            editable={ed}
            inputKind="tel"
            labels={labels}
            onFeedback={onFeedback}
          />
          <AdminUserInlineEditableField
            locale={locale}
            userId={detail.userId}
            field="dniOrPassport"
            label={labels.detailFieldDni}
            displayValue={detail.dniOrPassport || labels.detailNoValue}
            editInitial={detail.dniOrPassport}
            editable={ed}
            inputKind="text"
            labels={labels}
            onFeedback={onFeedback}
          />
        </CardShell>

        <CardShell title={labels.detailCardAcademic}>
          <AdminUserInlineEditableField
            locale={locale}
            userId={detail.userId}
            field="role"
            label={labels.detailFieldRole}
            displayValue={roleLabel}
            editInitial={detail.role}
            editable={ed}
            inputKind="select"
            selectOptions={roleOptions}
            labels={labels}
            onFeedback={onFeedback}
          />
          <AdminUserInlineEditableField
            locale={locale}
            userId={detail.userId}
            field="birthDate"
            label={labels.detailFieldBirth}
            displayValue={detail.birthDateDisplay ?? labels.detailNoValue}
            editInitial={detail.birthDateIso ?? ""}
            editable={ed}
            inputKind="date"
            labels={labels}
            onFeedback={onFeedback}
          />
          <ReadOnlyRow
            label={labels.detailFieldAge}
            value={detail.ageYears != null ? String(detail.ageYears) : labels.detailNoValue}
          />
          {detail.role === "student" ? (
            <ReadOnlyRow
              label={labels.detailFieldTeacher}
              value={detail.assignedTeacherName ?? labels.detailNoValue}
            />
          ) : null}
          <ReadOnlyRow label={labels.detailFieldCreated} value={detail.createdAtDisplay} />
        </CardShell>
      </div>

      {showFamilyCard ? (
        <AdminUserDetailTutorCard
          locale={locale}
          studentId={detail.userId}
          isMinor={detail.isMinor}
          tutorLinks={detail.tutorLinks}
          labels={labels}
          editable={ed}
          onFeedback={onFeedback}
        />
      ) : null}

      <AdminUserDetailPasswordSection locale={locale} userId={detail.userId} labels={labels} enabled={ed} onFeedback={onFeedback} />
    </div>
  );
}

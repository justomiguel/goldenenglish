"use client";

import type { ReactNode } from "react";
import type { Dictionary, Locale } from "@/types/i18n";
import type { AdminUserDetailVM } from "@/lib/dashboard/adminUserDetailVM";
import type { AdminStudentBillingTabData } from "@/types/adminStudentBilling";
import { AdminStudentBillingClient } from "@/components/dashboard/AdminStudentBillingClient";
import { AdminStudentCurrentCohortAssignmentCard } from "@/components/molecules/AdminStudentCurrentCohortAssignmentCard";
import { AdminUserDetailPasswordSection } from "@/components/molecules/AdminUserDetailPasswordSection";
import { AdminUserDetailTutorCard } from "@/components/molecules/AdminUserDetailTutorCard";
import { AdminUserInlineEditableField } from "@/components/molecules/AdminUserInlineEditableField";

type UserLabels = Dictionary["admin"]["users"];
type BillingLabels = Dictionary["admin"]["billing"];
type RoleOption = { value: string; label: string };

function CardShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[calc(var(--layout-border-radius)*1.2)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
      <h2 className="border-b border-[var(--color-border)] pb-3 font-display text-lg font-semibold text-[var(--color-secondary)]">
        {title}
      </h2>
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

export function AdminUserSummaryPanel({
  locale,
  detail,
  labels,
  editable,
  onFeedback,
}: {
  locale: Locale;
  detail: AdminUserDetailVM;
  labels: UserLabels;
  editable: boolean;
  onFeedback: (text: string, ok: boolean) => void;
}) {
  return (
    <CardShell title={labels.detailCardContact}>
      <AdminUserInlineEditableField locale={locale} userId={detail.userId} field="firstName" label={labels.detailFieldFirstName} displayValue={detail.firstName || labels.detailNoValue} editInitial={detail.firstName} editable={editable} inputKind="text" labels={labels} onFeedback={onFeedback} />
      <AdminUserInlineEditableField locale={locale} userId={detail.userId} field="lastName" label={labels.detailFieldLastName} displayValue={detail.lastName || labels.detailNoValue} editInitial={detail.lastName} editable={editable} inputKind="text" labels={labels} onFeedback={onFeedback} />
      <AdminUserInlineEditableField locale={locale} userId={detail.userId} field="email" label={labels.detailFieldEmail} displayValue={detail.emailDisplay} editInitial={detail.email} editable={editable} inputKind="email" labels={labels} onFeedback={onFeedback} />
      <AdminUserInlineEditableField locale={locale} userId={detail.userId} field="phone" label={labels.detailFieldPhone} displayValue={detail.phoneDisplay} editInitial={detail.phone} editable={editable} inputKind="tel" labels={labels} onFeedback={onFeedback} />
      <AdminUserInlineEditableField locale={locale} userId={detail.userId} field="dniOrPassport" label={labels.detailFieldDni} displayValue={detail.dniOrPassport || labels.detailNoValue} editInitial={detail.dniOrPassport} editable={editable} inputKind="text" labels={labels} onFeedback={onFeedback} />
    </CardShell>
  );
}

export function AdminUserAcademicPanel({
  locale,
  detail,
  labels,
  editable,
  roleLabel,
  roleOptions,
  onFeedback,
}: {
  locale: Locale;
  detail: AdminUserDetailVM;
  labels: UserLabels;
  editable: boolean;
  roleLabel: string;
  roleOptions: RoleOption[];
  onFeedback: (text: string, ok: boolean) => void;
}) {
  const currentCohortAssignment = detail.role === "student" ? detail.currentCohortAssignment : null;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(20rem,1.05fr)]">
      <CardShell title={labels.detailCardAcademic}>
        <AdminUserInlineEditableField locale={locale} userId={detail.userId} field="role" label={labels.detailFieldRole} displayValue={roleLabel} editInitial={detail.role} editable={editable} inputKind="select" selectOptions={roleOptions} labels={labels} onFeedback={onFeedback} />
        <AdminUserInlineEditableField locale={locale} userId={detail.userId} field="birthDate" label={labels.detailFieldBirth} displayValue={detail.birthDateDisplay ?? labels.detailNoValue} editInitial={detail.birthDateIso ?? ""} editable={editable} inputKind="date" labels={labels} onFeedback={onFeedback} />
        <ReadOnlyRow label={labels.detailFieldAge} value={detail.ageYears != null ? String(detail.ageYears) : labels.detailNoValue} />
        {detail.role === "student" ? (
          <ReadOnlyRow label={labels.detailFieldTeacher} value={detail.assignedTeacherName ?? labels.detailNoValue} />
        ) : null}
      </CardShell>
      {currentCohortAssignment ? (
        <AdminStudentCurrentCohortAssignmentCard
          locale={locale}
          studentId={detail.userId}
          labels={labels}
          assignment={currentCohortAssignment}
        />
      ) : null}
    </div>
  );
}

export function AdminUserPaymentsPanel({
  locale,
  detail,
  billing,
  billingLabels,
  studentName,
}: {
  locale: Locale;
  detail: AdminUserDetailVM;
  billing: AdminStudentBillingTabData;
  billingLabels: BillingLabels;
  studentName: string;
}) {
  return (
    <AdminStudentBillingClient
      locale={locale}
      studentId={detail.userId}
      studentName={studentName}
      payments={billing.payments}
      scholarships={billing.scholarships}
      sectionBenefits={billing.sectionBenefits}
      labels={billingLabels}
      enrollmentFeeExempt={billing.enrollmentFeeExempt}
      enrollmentExemptReason={billing.enrollmentExemptReason}
      lastEnrollmentPaidAt={billing.lastEnrollmentPaidAt}
      defaultYear={new Date().getFullYear()}
    />
  );
}

export function AdminUserFamilyPanel({
  locale,
  detail,
  labels,
  editable,
  onFeedback,
}: {
  locale: Locale;
  detail: AdminUserDetailVM;
  labels: UserLabels;
  editable: boolean;
  onFeedback: (text: string, ok: boolean) => void;
}) {
  if (detail.role !== "student") {
    return (
      <CardShell title={labels.detailCardFamily}>
        <p className="text-sm text-[var(--color-muted-foreground)]">{labels.detailFamilyEmpty}</p>
      </CardShell>
    );
  }

  return (
    <AdminUserDetailTutorCard
      locale={locale}
      studentId={detail.userId}
      isMinor={detail.isMinor}
      tutorLinks={detail.tutorLinks}
      labels={labels}
      editable={editable}
      onFeedback={onFeedback}
    />
  );
}

export function AdminUserSecurityPanel({
  locale,
  detail,
  labels,
  editable,
  onFeedback,
}: {
  locale: Locale;
  detail: AdminUserDetailVM;
  labels: UserLabels;
  editable: boolean;
  onFeedback: (text: string, ok: boolean) => void;
}) {
  return (
    <AdminUserDetailPasswordSection
      locale={locale}
      userId={detail.userId}
      labels={labels}
      enabled={editable}
      onFeedback={onFeedback}
    />
  );
}

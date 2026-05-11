"use client";

import { UserPlus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import { AdminCreateUserMinorGuardianPanel } from "@/components/dashboard/AdminCreateUserMinorGuardianPanel";
import { AdminCreateUserPersonalBlock } from "@/components/dashboard/AdminCreateUserPersonalBlock";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
import { useAdminCreateUserForm } from "@/hooks/useAdminCreateUserForm";

type BirthLabels = Pick<
  Dictionary["register"],
  | "birthDate"
  | "birthMonth"
  | "birthYear"
  | "birthDay"
  | "birthDayPlaceholder"
  | "birthDateHint"
  | "birthDatePickPrompt"
  | "birthDatePickedAnnouncement"
>;

interface AdminCreateUserFormProps {
  locale: string;
  legalAgeMajority: number;
  labels: Dictionary["admin"]["users"];
  birthLabels: BirthLabels;
  birthDateIncompleteMessage: string;
}

export function AdminCreateUserForm({
  locale,
  legalAgeMajority,
  labels,
  birthLabels,
  birthDateIncompleteMessage,
}: AdminCreateUserFormProps) {
  const f = useAdminCreateUserForm({
    locale,
    legalAgeMajority,
    labels,
    birthDateIncompleteMessage,
  });

  return (
    <>
      <form
        onSubmit={f.onSubmit}
        className="max-w-xl space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6"
      >
        <AdminCreateUserPersonalBlock
          locale={locale}
          labels={labels}
          birthLabels={birthLabels}
          firstName={f.firstName}
          lastName={f.lastName}
          onFirstNameChange={f.setFirstName}
          onLastNameChange={f.setLastName}
          showBirth={f.showBirth}
          birthDate={f.birthDate}
          onBirthDateChange={(v) => {
            f.setBirthDate(v);
            f.resetGuardianUi();
          }}
          showMinorSyntheticHint={f.showMinor}
          showAdultStudentEmail={f.showAdultStudentEmail}
          isStudent={f.isStudent}
          email={f.email}
          onEmailChange={f.setEmail}
          password={f.password}
          onPasswordChange={f.setPassword}
          passwordHintId={f.passwordHintId}
          role={f.role}
          onRoleChange={f.setRole}
          onLeaveStudentRole={() => {
            f.setBirthDate("");
            f.resetGuardianUi();
          }}
          showMinor={f.showMinor}
          dni={f.dni}
          onDniChange={f.setDni}
          phone={f.phone}
          onPhoneChange={f.setPhone}
        />

        {f.showMinor ? (
          <AdminCreateUserMinorGuardianPanel
            labels={labels}
            guardianMode={f.guardianMode}
            onGuardianModeChange={f.setGuardianMode}
            onResetGuardianFields={f.resetGuardianUi}
            searchParents={f.searchParents}
            pickedGuardian={f.pickedGuardian}
            onPickGuardian={(hit) => {
              f.setPickedGuardian(hit);
              f.setGuardianSearchKey((k) => k + 1);
            }}
            guardianSearchKey={f.guardianSearchKey}
            tutorDni={f.tutorDni}
            onTutorDniChange={f.setTutorDni}
            tutorFirstName={f.tutorFirstName}
            onTutorFirstNameChange={f.setTutorFirstName}
            tutorLastName={f.tutorLastName}
            onTutorLastNameChange={f.setTutorLastName}
            tutorEmail={f.tutorEmail}
            onTutorEmailChange={f.setTutorEmail}
            tutorPhone={f.tutorPhone}
            onTutorPhoneChange={f.setTutorPhone}
            relationship={f.relationship}
            onRelationshipChange={f.setRelationship}
          />
        ) : null}

        <Button type="submit" disabled={f.busy || f.reuseConfirm !== null} isLoading={f.busy}>
          {f.busy ? null : <UserPlus className="h-4 w-4 shrink-0" aria-hidden />}
          {labels.submit}
        </Button>

        {f.feedback ? (
          <p
            className={`text-sm ${
              f.feedback.ok
                ? "text-[var(--color-muted-foreground)]"
                : "text-[var(--color-error)]"
            }`}
            role={f.feedback.ok ? undefined : "alert"}
          >
            {f.feedback.text}
          </p>
        ) : null}
      </form>

      <ConfirmActionModal
        open={f.reuseConfirm !== null}
        onOpenChange={(o) => {
          if (!o) f.setReuseConfirm(null);
        }}
        title={labels.detailTutorCreateReuseConfirmTitle}
        description={
          f.reuseConfirm?.reuseKind === "reused_admin"
            ? labels.detailTutorCreateReuseConfirmDescriptionAdmin
            : labels.detailTutorCreateReuseConfirmDescriptionParent
        }
        cancelLabel={labels.detailTutorCreateCancel}
        confirmLabel={labels.detailTutorCreateReuseConfirmButton}
        confirmVariant="primary"
        busy={f.reuseBusy}
        disableClose={f.reuseBusy}
        onConfirm={() => void f.confirmReuseLink()}
      />
    </>
  );
}

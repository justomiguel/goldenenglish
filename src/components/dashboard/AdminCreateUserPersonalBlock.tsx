"use client";

import { useId } from "react";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import type { Dictionary } from "@/types/i18n";
import { adminUserRoleOptionLabel } from "@/lib/dashboard/adminUserRoleOptionLabel";
import { RegisterBirthDateDayPicker } from "@/components/molecules/RegisterBirthDateDayPicker";

const ROLES = ["admin", "teacher", "parent", "student", "assistant"] as const;

export type AdminCreateUserRoleOption = (typeof ROLES)[number];

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

type UserLabels = Dictionary["admin"]["users"];

export interface AdminCreateUserPersonalBlockProps {
  locale: string;
  labels: UserLabels;
  birthLabels: BirthLabels;
  firstName: string;
  lastName: string;
  onFirstNameChange: (v: string) => void;
  onLastNameChange: (v: string) => void;
  showBirth: boolean;
  birthDate: string;
  onBirthDateChange: (v: string) => void;
  showMinorSyntheticHint: boolean;
  showAdultStudentEmail: boolean;
  isStudent: boolean;
  email: string;
  onEmailChange: (v: string) => void;
  password: string;
  onPasswordChange: (v: string) => void;
  passwordHintId: string;
  role: AdminCreateUserRoleOption;
  onRoleChange: (role: AdminCreateUserRoleOption) => void;
  onLeaveStudentRole: () => void;
  showMinor: boolean;
  dni: string;
  onDniChange: (v: string) => void;
  phone: string;
  onPhoneChange: (v: string) => void;
}

export function AdminCreateUserPersonalBlock({
  locale,
  labels,
  birthLabels,
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  showBirth,
  birthDate,
  onBirthDateChange,
  showMinorSyntheticHint,
  showAdultStudentEmail,
  isStudent,
  email,
  onEmailChange,
  password,
  onPasswordChange,
  passwordHintId,
  role,
  onRoleChange,
  onLeaveStudentRole,
  showMinor,
  dni,
  onDniChange,
  phone,
  onPhoneChange,
}: AdminCreateUserPersonalBlockProps) {
  const autoPwHintId = useId();
  const hintId = passwordHintId || autoPwHintId;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div data-tour="admin-create-user-last-name">
          <Label htmlFor="cu-ln">{labels.lastName}</Label>
          <Input
            id="cu-ln"
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </div>
        <div data-tour="admin-create-user-first-name">
          <Label htmlFor="cu-fn">{labels.firstName}</Label>
          <Input
            id="cu-fn"
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            required
            className="mt-1 w-full"
          />
        </div>
      </div>

      {showBirth ? (
        <div data-tour="admin-create-user-birth">
          <RegisterBirthDateDayPicker
            locale={locale}
            birthDateLegendRequired
            labels={birthLabels}
            value={birthDate}
            onChange={onBirthDateChange}
          />
        </div>
      ) : null}

      {showMinorSyntheticHint ? (
        <p
          className="text-xs text-[var(--color-muted-foreground)]"
          role="note"
          data-tour="admin-create-user-minor-hint"
        >
          {labels.createUserMinorSyntheticEmailHint}
        </p>
      ) : null}

      {showAdultStudentEmail || !isStudent ? (
        <div data-tour="admin-create-user-email">
          <Label htmlFor="cu-email">{labels.email}</Label>
          <Input
            id="cu-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required={showAdultStudentEmail || !isStudent}
            className="mt-1 w-full"
          />
        </div>
      ) : null}

      <div data-tour="admin-create-user-password">
        <Label htmlFor="cu-pass">{labels.password}</Label>
        <Input
          id="cu-pass"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          aria-describedby={hintId}
          className="mt-1 w-full"
        />
        <p id={hintId} className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {labels.passwordHint}
        </p>
      </div>
      <div data-tour="admin-create-user-role">
        <Label htmlFor="cu-role">{labels.role}</Label>
        <select
          id="cu-role"
          value={role}
          onChange={(e) => {
            const next = e.target.value as AdminCreateUserRoleOption;
            onRoleChange(next);
            if (next !== "student") {
              onLeaveStudentRole();
            }
          }}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {adminUserRoleOptionLabel(labels, r)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.roleHint}</p>
      </div>

      <div data-tour="admin-create-user-dni">
        <Label htmlFor="cu-dni" required={showMinor}>
          {labels.dni}
        </Label>
        <Input
          id="cu-dni"
          autoComplete="off"
          value={dni}
          onChange={(e) => onDniChange(e.target.value)}
          required={showMinor}
          className="mt-1 w-full"
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {showMinor ? labels.createUserDniRequiredMinorHint : labels.dniOptionalHint}
        </p>
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.documentIdFormatHint}</p>
      </div>

      {!showMinor ? (
        <div data-tour="admin-create-user-phone">
          <Label htmlFor="cu-ph">{labels.phone}</Label>
          <Input
            id="cu-ph"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            className="mt-1 w-full"
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.phoneOptionalHint}</p>
        </div>
      ) : null}
    </>
  );
}

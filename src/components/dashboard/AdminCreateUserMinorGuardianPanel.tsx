"use client";

import { useId } from "react";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import type { Dictionary } from "@/types/i18n";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import { AdminStudentSearchCombobox } from "@/components/molecules/AdminStudentSearchCombobox";
import { AdminUserDetailTutorRelationshipSelect } from "@/components/molecules/AdminUserDetailTutorRelationshipSelect";
import type { TutorStudentRelationshipCode } from "@/lib/register/tutorStudentRelationship";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminCreateUserMinorGuardianPanelProps {
  labels: UserLabels;
  guardianMode: "existing" | "new";
  onGuardianModeChange: (mode: "existing" | "new") => void;
  onResetGuardianFields: () => void;
  searchParents: (q: string) => Promise<AdminStudentSearchHitLike[]>;
  pickedGuardian: AdminStudentSearchHitLike | null;
  onPickGuardian: (hit: AdminStudentSearchHitLike) => void;
  guardianSearchKey: number;
  tutorDni: string;
  onTutorDniChange: (v: string) => void;
  tutorFirstName: string;
  onTutorFirstNameChange: (v: string) => void;
  tutorLastName: string;
  onTutorLastNameChange: (v: string) => void;
  tutorEmail: string;
  onTutorEmailChange: (v: string) => void;
  tutorPhone: string;
  onTutorPhoneChange: (v: string) => void;
  relationship: TutorStudentRelationshipCode | "";
  onRelationshipChange: (v: TutorStudentRelationshipCode | "") => void;
}

export function AdminCreateUserMinorGuardianPanel({
  labels,
  guardianMode,
  onGuardianModeChange,
  onResetGuardianFields,
  searchParents,
  pickedGuardian,
  onPickGuardian,
  guardianSearchKey,
  tutorDni,
  onTutorDniChange,
  tutorFirstName,
  onTutorFirstNameChange,
  tutorLastName,
  onTutorLastNameChange,
  tutorEmail,
  onTutorEmailChange,
  tutorPhone,
  onTutorPhoneChange,
  relationship,
  onRelationshipChange,
}: AdminCreateUserMinorGuardianPanelProps) {
  const guardianSearchId = useId();

  return (
    <fieldset className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-4">
      <legend className="px-1 text-sm font-semibold text-[var(--color-foreground)]">
        {labels.createUserGuardianLegend}
      </legend>
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.createUserGuardianLead}</p>
      <div className="flex flex-wrap gap-4">
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="guardian_mode"
            checked={guardianMode === "existing"}
            onChange={() => {
              onGuardianModeChange("existing");
              onResetGuardianFields();
            }}
            className="h-4 w-4"
          />
          {labels.createUserGuardianModeExisting}
        </label>
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="radio"
            name="guardian_mode"
            checked={guardianMode === "new"}
            onChange={() => {
              onGuardianModeChange("new");
              onResetGuardianFields();
            }}
            className="h-4 w-4"
          />
          {labels.createUserGuardianModeNew}
        </label>
      </div>
      {guardianMode === "existing" ? (
        <div className="space-y-2">
          <AdminStudentSearchCombobox
            id={guardianSearchId}
            labelText={labels.createUserGuardianSearchLabel}
            placeholder={labels.createUserGuardianSearchPlaceholder}
            minCharsHint={labels.createUserGuardianSearchMinChars}
            search={searchParents}
            onPick={onPickGuardian}
            resetKey={guardianSearchKey}
            excludeIds={[]}
          />
          {pickedGuardian ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {labels.createUserGuardianSelected}: {pickedGuardian.label}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="cu-tdni">{labels.detailTutorCreateDni}</Label>
            <Input
              id="cu-tdni"
              value={tutorDni}
              onChange={(e) => onTutorDniChange(e.target.value)}
              required
              className="mt-1 w-full max-w-full"
            />
          </div>
          <div>
            <Label htmlFor="cu-tfn">{labels.detailTutorCreateFirstName}</Label>
            <Input
              id="cu-tfn"
              value={tutorFirstName}
              onChange={(e) => onTutorFirstNameChange(e.target.value)}
              required
              className="mt-1 w-full"
            />
          </div>
          <div>
            <Label htmlFor="cu-tln">{labels.detailTutorCreateLastName}</Label>
            <Input
              id="cu-tln"
              value={tutorLastName}
              onChange={(e) => onTutorLastNameChange(e.target.value)}
              required
              className="mt-1 w-full"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cu-tem">{labels.detailTutorCreateEmail}</Label>
            <Input
              id="cu-tem"
              type="email"
              value={tutorEmail}
              onChange={(e) => onTutorEmailChange(e.target.value)}
              className="mt-1 w-full"
            />
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
              {labels.detailTutorCreateEmailHint}
            </p>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="cu-tph">{labels.detailTutorCreatePhone}</Label>
            <Input
              id="cu-tph"
              type="tel"
              value={tutorPhone}
              onChange={(e) => onTutorPhoneChange(e.target.value)}
              className="mt-1 w-full"
            />
          </div>
        </div>
      )}
      <AdminUserDetailTutorRelationshipSelect
        id="cu-guardian-rel"
        value={relationship}
        onChange={onRelationshipChange}
        labels={labels}
        labelOverride={labels.detailTutorCreateRelationship}
        hintOverride={labels.detailTutorCreateRelationshipHint}
      />
    </fieldset>
  );
}

"use client";

import { useId } from "react";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import {
  TUTOR_STUDENT_RELATIONSHIP_CODES,
  isTutorStudentRelationshipCode,
  type TutorStudentRelationshipCode,
} from "@/lib/register/tutorStudentRelationship";

type UserLabels = Dictionary["admin"]["users"];

export function formatAdminTutorRelationshipLabel(labels: UserLabels, stored: string | null): string {
  if (!stored?.trim()) return labels.detailTutorRelationshipNotSpecified;
  const c = stored.trim();
  if (!isTutorStudentRelationshipCode(c)) return c;
  const map: Record<TutorStudentRelationshipCode, string> = {
    mother: labels.detailTutorRelationshipMother,
    father: labels.detailTutorRelationshipFather,
    legal_guardian: labels.detailTutorRelationshipLegalGuardian,
    grandparent: labels.detailTutorRelationshipGrandparent,
    step_parent: labels.detailTutorRelationshipStepParent,
    sibling: labels.detailTutorRelationshipSibling,
    other_relative: labels.detailTutorRelationshipOtherRelative,
    other: labels.detailTutorRelationshipOther,
  };
  return map[c];
}

export interface AdminUserDetailTutorRelationshipSelectProps {
  id?: string;
  value: TutorStudentRelationshipCode | "";
  onChange: (value: TutorStudentRelationshipCode | "") => void;
  labels: UserLabels;
  disabled?: boolean;
  /** When set, overrides `detailTutorRelationshipLabel` + hint (e.g. create-guardian modal). */
  labelOverride?: string;
  hintOverride?: string;
}

export function AdminUserDetailTutorRelationshipSelect({
  id,
  value,
  onChange,
  labels,
  disabled = false,
  labelOverride,
  hintOverride,
}: AdminUserDetailTutorRelationshipSelectProps) {
  const autoId = useId();
  const sid = id ?? `tutor-relationship-${autoId}`;
  const labelText = labelOverride ?? labels.detailTutorRelationshipLabel;
  const hintText = hintOverride ?? labels.detailTutorRelationshipHint;
  return (
    <div>
      <Label htmlFor={sid}>{labelText}</Label>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hintText}</p>
      <select
        id={sid}
        value={value}
        disabled={disabled}
        required
        aria-required
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? "" : (v as TutorStudentRelationshipCode));
        }}
        className="mt-2 min-h-[44px] w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)]"
      >
        <option value="">{labels.detailTutorRelationshipPlaceholder}</option>
        {TUTOR_STUDENT_RELATIONSHIP_CODES.map((code) => (
          <option key={code} value={code}>
            {formatAdminTutorRelationshipLabel(labels, code)}
          </option>
        ))}
      </select>
    </div>
  );
}

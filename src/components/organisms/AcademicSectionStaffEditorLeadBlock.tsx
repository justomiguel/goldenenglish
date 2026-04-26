"use client";

import { Save } from "lucide-react";
import { Label } from "@/components/atoms/Label";
import { Button } from "@/components/atoms/Button";
import type { AcademicSectionStaffEditorDict } from "@/components/organisms/academicSectionStaffEditorTypes";

export interface AcademicSectionStaffEditorLeadBlockProps {
  sectionId: string;
  teachers: { id: string; label: string }[];
  teacherId: string;
  onTeacherChange: (id: string) => void;
  pendingLead: boolean;
  dirtyLead: boolean;
  onSaveLead: () => void;
  msgLead: string | null;
  dict: Pick<
    AcademicSectionStaffEditorDict,
    "leadLabel" | "leadSave" | "leadSaved" | "leadError"
  >;
}

export function AcademicSectionStaffEditorLeadBlock({
  sectionId,
  teachers,
  teacherId,
  onTeacherChange,
  pendingLead,
  dirtyLead,
  onSaveLead,
  msgLead,
  dict,
}: AcademicSectionStaffEditorLeadBlockProps) {
  return (
    <div className="mt-4 space-y-3 border-b border-[var(--color-border)] pb-4">
      <Label htmlFor={`sec-staff-lead-${sectionId}`}>{dict.leadLabel}</Label>
      <select
        id={`sec-staff-lead-${sectionId}`}
        className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
        value={teacherId}
        disabled={pendingLead || teachers.length === 0}
        onChange={(e) => onTeacherChange(e.target.value)}
      >
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      <Button type="button" disabled={pendingLead || !dirtyLead} isLoading={pendingLead} onClick={onSaveLead}>
        {!pendingLead ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {dict.leadSave}
      </Button>
      {msgLead ? (
        <p className="text-sm text-[var(--color-foreground)]" role="status">
          {msgLead}
        </p>
      ) : null}
    </div>
  );
}

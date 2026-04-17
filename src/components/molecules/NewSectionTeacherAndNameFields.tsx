"use client";

import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";

export interface NewSectionTeacherAndNameFieldsDict {
  nameLabel: string;
  teacherLabel: string;
  teacherPlaceholder: string;
}

export interface NewSectionTeacherAndNameFieldsProps {
  name: string;
  onNameChange: (v: string) => void;
  teacherId: string;
  onTeacherIdChange: (v: string) => void;
  teachers: { id: string; label: string }[];
  dict: NewSectionTeacherAndNameFieldsDict;
  disabled?: boolean;
}

export function NewSectionTeacherAndNameFields({
  name,
  onNameChange,
  teacherId,
  onTeacherIdChange,
  teachers,
  dict,
  disabled,
}: NewSectionTeacherAndNameFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="ns-name">{dict.nameLabel}</Label>
        <Input
          id="ns-name"
          className="mt-1 w-full"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          disabled={disabled}
          autoComplete="off"
        />
      </div>
      <div>
        <Label htmlFor="ns-teacher">{dict.teacherLabel}</Label>
        <select
          id="ns-teacher"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
          value={teacherId}
          onChange={(e) => onTeacherIdChange(e.target.value)}
          disabled={disabled || teachers.length === 0}
        >
          <option value="">{dict.teacherPlaceholder}</option>
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

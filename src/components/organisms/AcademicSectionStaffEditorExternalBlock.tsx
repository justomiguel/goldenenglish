"use client";

import { Label } from "@/components/atoms/Label";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import type { AcademicSectionStaffEditorDict } from "@/components/organisms/academicSectionStaffEditorTypes";

export interface AcademicSectionStaffEditorExternalBlockProps {
  sectionId: string;
  externalNames: string[];
  newExternalName: string;
  onNewExternalNameChange: (v: string) => void;
  onRemoveName: (name: string) => void;
  onAddExternal: () => void;
  pendingExt: boolean;
  dirtyExt: boolean;
  onSaveExternal: () => void;
  msgExt: string | null;
  dict: Pick<
    AcademicSectionStaffEditorDict,
    | "externalTitle"
    | "externalHint"
    | "externalNameLabel"
    | "externalNamePlaceholder"
    | "externalAdd"
    | "externalSave"
    | "removeExternalAria"
  >;
}

export function AcademicSectionStaffEditorExternalBlock({
  sectionId,
  externalNames,
  newExternalName,
  onNewExternalNameChange,
  onRemoveName,
  onAddExternal,
  pendingExt,
  dirtyExt,
  onSaveExternal,
  msgExt,
  dict,
}: AcademicSectionStaffEditorExternalBlockProps) {
  return (
    <div className="mt-4 space-y-3">
      <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.externalTitle}</p>
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.externalHint}</p>
      <ul className="space-y-2">
        {externalNames.map((name, i) => (
          <li
            key={`${name}-${i}`}
            className="flex items-center justify-between gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-3 py-2 text-sm"
          >
            <span>{name}</span>
            <Button
              type="button"
              variant="ghost"
              className="shrink-0"
              disabled={pendingExt}
              onClick={() => onRemoveName(name)}
              aria-label={dict.removeExternalAria}
            >
              ×
            </Button>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Label htmlFor={`sec-staff-ext-${sectionId}`}>{dict.externalNameLabel}</Label>
          <Input
            id={`sec-staff-ext-${sectionId}`}
            value={newExternalName}
            onChange={(e) => onNewExternalNameChange(e.target.value)}
            placeholder={dict.externalNamePlaceholder}
            disabled={pendingExt}
            className="mt-1 w-full"
            maxLength={200}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          className="min-h-[44px] shrink-0"
          disabled={pendingExt || !newExternalName.trim()}
          onClick={onAddExternal}
        >
          {dict.externalAdd}
        </Button>
      </div>
      <Button type="button" disabled={pendingExt || !dirtyExt} isLoading={pendingExt} onClick={onSaveExternal}>
        {dict.externalSave}
      </Button>
      {msgExt ? (
        <p className="text-sm text-[var(--color-foreground)]" role="status">
          {msgExt}
        </p>
      ) : null}
    </div>
  );
}

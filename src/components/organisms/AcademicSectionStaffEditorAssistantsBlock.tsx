"use client";

import { useCallback, useMemo, useState } from "react";
import { Save, UserPlus, X } from "lucide-react";
import { Label } from "@/components/atoms/Label";
import { Button } from "@/components/atoms/Button";
import { AdminStudentSearchCombobox } from "@/components/molecules/AdminStudentSearchCombobox";
import { searchAdminStudentsAction } from "@/app/[locale]/dashboard/admin/academic/cohortActions";
import type {
  SectionStaffPortalPickOption,
  SectionStaffProfileAssistant,
} from "@/lib/academics/loadAdminSectionTeachersAndAssistants";
import type { AcademicSectionStaffEditorDict } from "@/components/organisms/academicSectionStaffEditorTypes";

type AssistantBadgeDict = Pick<
  AcademicSectionStaffEditorDict,
  "assistantBadgeTeacher" | "assistantBadgeStudent" | "assistantBadgePortalAssistant"
>;

function assistantRoleBadge(dict: AssistantBadgeDict, role: string): string {
  if (role === "student") return dict.assistantBadgeStudent;
  if (role === "assistant") return dict.assistantBadgePortalAssistant;
  return dict.assistantBadgeTeacher;
}

export interface AcademicSectionStaffEditorAssistantsBlockProps {
  sectionId: string;
  teachers: { id: string; label: string }[];
  assistantPortalStaffOptions: SectionStaffPortalPickOption[];
  initialAssistants: SectionStaffProfileAssistant[];
  assistantIds: string[];
  assistantExtras: Record<string, { label: string; role: string }>;
  onAssistantIdsChange: (ids: string[]) => void;
  onAssistantExtrasChange: (next: Record<string, { label: string; role: string }>) => void;
  teacherId: string;
  pendingAsst: boolean;
  dirtyAsst: boolean;
  onSaveAssistants: () => void;
  msgAsst: string | null;
  dict: Pick<
    AcademicSectionStaffEditorDict,
    | "assistantsTitle"
    | "assistantsHint"
    | "pickStaffAssistantLabel"
    | "addStaffAssistantSubmit"
    | "staffAssistantPlaceholder"
    | "pickStudentAssistantLabel"
    | "studentAssistantMinHint"
    | "assistantsSave"
    | "removeAssistantAria"
    | "assistantBadgeTeacher"
    | "assistantBadgeStudent"
    | "assistantBadgePortalAssistant"
  >;
}

export function AcademicSectionStaffEditorAssistantsBlock({
  sectionId,
  teachers,
  assistantPortalStaffOptions,
  initialAssistants,
  assistantIds,
  assistantExtras,
  onAssistantIdsChange,
  onAssistantExtrasChange,
  teacherId,
  pendingAsst,
  dirtyAsst,
  onSaveAssistants,
  msgAsst,
  dict,
}: AcademicSectionStaffEditorAssistantsBlockProps) {
  const [pickStaffAssistant, setPickStaffAssistant] = useState("");
  const [studentSearchReset, setStudentSearchReset] = useState(0);

  const assistantLabelById = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of teachers) m.set(t.id, t.label);
    for (const o of assistantPortalStaffOptions) m.set(o.id, o.label);
    for (const a of initialAssistants) m.set(a.id, a.label);
    return m;
  }, [teachers, assistantPortalStaffOptions, initialAssistants]);

  const addableStaffAssistants = useMemo(
    () => assistantPortalStaffOptions.filter((t) => t.id !== teacherId && !assistantIds.includes(t.id)),
    [assistantPortalStaffOptions, teacherId, assistantIds],
  );

  const searchStudents = useCallback((q: string) => searchAdminStudentsAction(q), []);

  const addStaffAssistant = () => {
    const id = pickStaffAssistant.trim();
    if (!id || assistantIds.includes(id) || id === teacherId) return;
    const opt = assistantPortalStaffOptions.find((o) => o.id === id);
    if (!opt) return;
    onAssistantIdsChange([...assistantIds, id]);
    onAssistantExtrasChange({
      ...assistantExtras,
      [id]: { label: opt.label, role: opt.role },
    });
    setPickStaffAssistant("");
  };

  const removeAssistant = (id: string) => {
    onAssistantIdsChange(assistantIds.filter((x) => x !== id));
    const next = { ...assistantExtras };
    delete next[id];
    onAssistantExtrasChange(next);
  };

  return (
    <div className="mt-4 space-y-3 border-b border-[var(--color-border)] pb-4">
      <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.assistantsTitle}</p>
      <p className="text-xs text-[var(--color-muted-foreground)]">{dict.assistantsHint}</p>
      <ul className="space-y-2">
        {assistantIds.map((id) => {
          const role = assistantExtras[id]?.role ?? "teacher";
          return (
            <li
              key={id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/10 px-3 py-2 text-sm"
            >
              <span>
                <span className="font-medium text-[var(--color-foreground)]">
                  {assistantLabelById.get(id) ?? id}
                </span>
                <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">
                  {assistantRoleBadge(dict, role)}
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                className="shrink-0"
                disabled={pendingAsst}
                onClick={() => removeAssistant(id)}
                aria-label={dict.removeAssistantAria}
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Label htmlFor={`sec-staff-asst-${sectionId}`}>{dict.pickStaffAssistantLabel}</Label>
          <select
            id={`sec-staff-asst-${sectionId}`}
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            value={pickStaffAssistant}
            disabled={pendingAsst || addableStaffAssistants.length === 0}
            onChange={(e) => setPickStaffAssistant(e.target.value)}
          >
            <option value="">{dict.staffAssistantPlaceholder}</option>
            {addableStaffAssistants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="min-h-[44px] shrink-0"
          disabled={pendingAsst || !pickStaffAssistant}
          onClick={addStaffAssistant}
        >
          <UserPlus className="h-4 w-4 shrink-0" aria-hidden />
          {dict.addStaffAssistantSubmit}
        </Button>
      </div>
      <AdminStudentSearchCombobox
        id={`sec-staff-student-asst-${sectionId}`}
        labelText={dict.pickStudentAssistantLabel}
        placeholder={dict.pickStudentAssistantLabel}
        minCharsHint={dict.studentAssistantMinHint}
        prefetchWhenEmptyOnFocus
        disabled={pendingAsst}
        search={searchStudents}
        resetKey={studentSearchReset}
        onPick={(hit) => {
          if (hit.id === teacherId || assistantIds.includes(hit.id)) return;
          onAssistantIdsChange([...assistantIds, hit.id]);
          onAssistantExtrasChange({
            ...assistantExtras,
            [hit.id]: { label: hit.label, role: "student" },
          });
          setStudentSearchReset((k) => k + 1);
        }}
      />
      <Button type="button" disabled={pendingAsst || !dirtyAsst} isLoading={pendingAsst} onClick={onSaveAssistants}>
        {!pendingAsst ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
        {dict.assistantsSave}
      </Button>
      {msgAsst ? (
        <p className="text-sm text-[var(--color-foreground)]" role="status">
          {msgAsst}
        </p>
      ) : null}
    </div>
  );
}

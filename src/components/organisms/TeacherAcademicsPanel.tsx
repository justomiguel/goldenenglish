"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { AdminStudentSearchCombobox } from "@/components/molecules/AdminStudentSearchCombobox";
import type { AdminStudentSearchHitLike } from "@/components/molecules/AdminStudentSearchCombobox";
import {
  createSectionTransferRequestAction,
  searchTeacherStudentsInOwnSectionsAction,
} from "@/app/[locale]/dashboard/teacher/academics/actions";

export interface TeacherSectionOption {
  id: string;
  name: string;
  cohortId: string;
  cohortName: string;
  accessRole?: "lead" | "assistant";
}

export interface TeacherAcademicsPanelProps {
  locale: string;
  dict: Dictionary;
  sections: TeacherSectionOption[];
}

export function TeacherAcademicsPanel({ locale, dict, sections }: TeacherAcademicsPanelProps) {
  const d = dict.dashboard.teacherAcademics;
  const mySectionsDict = dict.dashboard.teacherMySections;
  const [picked, setPicked] = useState<AdminStudentSearchHitLike | null>(null);
  const [fieldResetKey, setFieldResetKey] = useState(0);
  const [fromId, setFromId] = useState(sections[0]?.id ?? "");
  const [toId, setToId] = useState(sections[1]?.id ?? sections[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const sectionIds = useMemo(() => sections.map((s) => s.id), [sections]);

  const searchStudents = useCallback(
    (q: string) => searchTeacherStudentsInOwnSectionsAction(q, sectionIds),
    [sectionIds],
  );

  const submit = () => {
    if (!picked) return;
    setMsg(null);
    start(async () => {
      const r = await createSectionTransferRequestAction({
        locale,
        studentId: picked.id,
        fromSectionId: fromId,
        toSectionId: toId,
        note: note.trim() || null,
      });
      if (r.ok) {
        setMsg(d.requestSuccess);
        setPicked(null);
        setFieldResetKey((k) => k + 1);
        return;
      }
      setMsg(d.requestError);
    });
  };

  if (sections.length === 0) {
    return <p className="text-sm text-[var(--color-muted-foreground)]">{d.noSections}</p>;
  }

  return (
    <div className="max-w-lg space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">{d.delinquencyHint}</p>
      <AdminStudentSearchCombobox
        id="teacher-academics-student"
        labelText={d.studentSearchLabel}
        placeholder={d.searchPlaceholder}
        inputTitle={d.studentSearchTooltip}
        minCharsHint={d.searchMin}
        disabled={pending}
        search={searchStudents}
        onPick={setPicked}
        resetKey={fieldResetKey}
      />
      <div>
        <label className="block text-sm font-medium" htmlFor="ta-from">
          {d.fromSectionLabel}
        </label>
        <select
          id="ta-from"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={fromId}
          onChange={(e) => setFromId(e.target.value)}
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.cohortName} — {s.name}
              {s.accessRole === "assistant" ? ` · ${mySectionsDict.assistantBadge}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="ta-to">
          {d.toSectionLabel}
        </label>
        <select
          id="ta-to"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={toId}
          onChange={(e) => setToId(e.target.value)}
        >
          {sections.map((s) => (
            <option key={s.id} value={s.id}>
              {s.cohortName} — {s.name}
              {s.accessRole === "assistant" ? ` · ${mySectionsDict.assistantBadge}` : ""}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="ta-note">
          {d.noteLabel}
        </label>
        <textarea
          id="ta-note"
          rows={2}
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      {msg ? <p className="text-sm text-[var(--color-foreground)]">{msg}</p> : null}
      <Button type="button" onClick={submit} disabled={pending || !picked}>
        {d.submitRequest}
      </Button>
    </div>
  );
}

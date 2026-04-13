"use client";

import { useState, useTransition } from "react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { createSectionTransferRequestAction } from "@/app/[locale]/dashboard/teacher/academics/actions";

export interface TeacherSectionOption {
  id: string;
  name: string;
  cohortId: string;
  cohortName: string;
}

export interface TeacherAcademicsPanelProps {
  locale: string;
  dict: Dictionary;
  sections: TeacherSectionOption[];
}

export function TeacherAcademicsPanel({ locale, dict, sections }: TeacherAcademicsPanelProps) {
  const d = dict.dashboard.teacherAcademics;
  const [studentId, setStudentId] = useState("");
  const [fromId, setFromId] = useState(sections[0]?.id ?? "");
  const [toId, setToId] = useState(sections[1]?.id ?? sections[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setMsg(null);
    start(async () => {
      const r = await createSectionTransferRequestAction({
        locale,
        studentId: studentId.trim(),
        fromSectionId: fromId,
        toSectionId: toId,
        note: note.trim() || null,
      });
      setMsg(r.ok ? d.requestSuccess : d.requestError);
    });
  };

  if (sections.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted-foreground)]">{d.noSections}</p>
    );
  }

  return (
    <div className="max-w-lg space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-sm text-[var(--color-muted-foreground)]">{d.delinquencyHint}</p>
      <div>
        <label className="block text-sm font-medium" htmlFor="ta-student">
          {d.studentIdLabel}
        </label>
        <input
          id="ta-student"
          className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          autoComplete="off"
        />
      </div>
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
      <Button type="button" onClick={submit} disabled={pending || !studentId.trim()}>
        {d.submitRequest}
      </Button>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { updateAcademicSectionMaxStudentsAction } from "@/app/[locale]/dashboard/admin/academic/sectionCapacityActions";

export interface AcademicSectionCapacityEditorProps {
  locale: string;
  sectionId: string;
  initialMaxStudents: number;
  activeEnrollments: number;
  siteDefaultMax: number;
  dict: Dictionary["dashboard"]["academicSectionPage"]["capacity"];
}

export function AcademicSectionCapacityEditor({
  locale,
  sectionId,
  initialMaxStudents,
  activeEnrollments,
  siteDefaultMax,
  dict,
}: AcademicSectionCapacityEditorProps) {
  const router = useRouter();
  const [maxStudents, setMaxStudents] = useState(String(initialMaxStudents));
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const dirty = maxStudents.trim() !== String(initialMaxStudents);

  const save = () => {
    setMsg(null);
    const n = Number.parseInt(maxStudents.trim(), 10);
    start(async () => {
      const r = await updateAcademicSectionMaxStudentsAction({
        locale,
        sectionId,
        maxStudents: n,
      });
      if (r.ok) {
        setMsg(dict.success);
        router.refresh();
        return;
      }
      const err =
        r.code === "BELOW_ACTIVE"
          ? dict.errorBelowActive.replace(/\{\{active\}\}/g, String(activeEnrollments))
          : r.code === "PARSE"
            ? dict.errorParse
            : dict.errorSave;
      setMsg(err);
    });
  };

  const hintActive = dict.hintActive.replace(/\{\{active\}\}/g, String(activeEnrollments));
  const hintDefault = dict.hintDefault.replace(/\{\{default\}\}/g, String(siteDefaultMax));

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hintActive}</p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hintDefault}</p>
      <div className="mt-3 space-y-2">
        <Label htmlFor={`sec-cap-${sectionId}`}>{dict.label}</Label>
        <Input
          id={`sec-cap-${sectionId}`}
          type="number"
          inputMode="numeric"
          min={Math.max(1, activeEnrollments)}
          max={999}
          value={maxStudents}
          onChange={(e) => setMaxStudents(e.target.value)}
          disabled={pending}
          className="max-w-[12rem]"
        />
        <Button type="button" disabled={pending || !dirty} isLoading={pending} onClick={save}>
          {dict.save}
        </Button>
        {msg ? (
          <p className="text-sm text-[var(--color-foreground)]" role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </section>
  );
}

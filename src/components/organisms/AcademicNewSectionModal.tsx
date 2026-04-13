"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { createAcademicSectionAction } from "@/app/[locale]/dashboard/admin/academic/cohortActions";

export interface AcademicNewSectionModalDict {
  title: string;
  nameLabel: string;
  teacherLabel: string;
  teacherPlaceholder: string;
  maxStudentsLabel: string;
  maxStudentsHint: string;
  submit: string;
  cancel: string;
  error: string;
  noTeachers: string;
}

export interface AcademicNewSectionModalProps {
  locale: string;
  cohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teachers: { id: string; label: string }[];
  dict: AcademicNewSectionModalDict;
}

export function AcademicNewSectionModal({
  locale,
  cohortId,
  open,
  onOpenChange,
  teachers,
  dict,
}: AcademicNewSectionModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [maxRaw, setMaxRaw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = () => {
    setErr(null);
    const max =
      maxRaw.trim() === "" ? null : Number.parseInt(maxRaw.trim(), 10);
    start(async () => {
      const r = await createAcademicSectionAction({
        locale,
        cohortId,
        name,
        teacherId,
        maxStudents: max != null && Number.isFinite(max) ? max : null,
      });
      if (!r.ok) {
        setErr(dict.error);
        return;
      }
      onOpenChange(false);
      setName("");
      setTeacherId("");
      setMaxRaw("");
      router.push(`/${locale}/dashboard/admin/academic/${cohortId}/${r.id}`);
      router.refresh();
    });
  };

  const canSubmit =
    name.trim().length >= 2 && teacherId.length > 0 && teachers.length > 0;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId="new-section-title"
      title={dict.title}
      disableClose={pending}
    >
      <div className="space-y-3">
        {teachers.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{dict.noTeachers}</p>
        ) : null}

        <div>
          <Label htmlFor="ns-name">{dict.nameLabel}</Label>
          <Input
            id="ns-name"
            className="mt-1 w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={pending}
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="ns-teacher">{dict.teacherLabel}</Label>
          <select
            id="ns-teacher"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            disabled={pending || teachers.length === 0}
          >
            <option value="">{dict.teacherPlaceholder}</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="ns-max">{dict.maxStudentsLabel}</Label>
          <Input
            id="ns-max"
            type="number"
            min={1}
            className="mt-1 w-full"
            value={maxRaw}
            onChange={(e) => setMaxRaw(e.target.value)}
            disabled={pending}
            placeholder=""
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.maxStudentsHint}</p>
        </div>

        {err ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {err}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
            {dict.cancel}
          </Button>
          <Button
            type="button"
            isLoading={pending}
            disabled={pending || !canSubmit}
            onClick={submit}
          >
            {dict.submit}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

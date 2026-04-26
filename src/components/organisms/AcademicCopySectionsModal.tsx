"use client";

import { Copy, X } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { copyCohortSectionStructureAction } from "@/app/[locale]/dashboard/admin/academic/copyCohortSectionsActions";

export interface AcademicCopySectionsModalDict {
  title: string;
  lead: string;
  sourceLabel: string;
  sourcePlaceholder: string;
  includeStudentsLabel: string;
  includeStudentsHint: string;
  submit: string;
  cancel: string;
  error: string;
  errorEmptySource: string;
}

export interface AcademicCopySectionsModalProps {
  locale: string;
  targetCohortId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceCohortOptions: { id: string; label: string }[];
  dict: AcademicCopySectionsModalDict;
}

export function AcademicCopySectionsModal({
  locale,
  targetCohortId,
  open,
  onOpenChange,
  sourceCohortOptions,
  dict,
}: AcademicCopySectionsModalProps) {
  const router = useRouter();
  const [sourceId, setSourceId] = useState("");
  const [includeStudents, setIncludeStudents] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSourceId("");
      setIncludeStudents(false);
      setErr(null);
    }
    onOpenChange(next);
  };

  const submit = () => {
    setErr(null);
    start(async () => {
      const r = await copyCohortSectionStructureAction({
        locale,
        sourceCohortId: sourceId,
        targetCohortId,
        includeStudents,
      });
      if (!r.ok) {
        setErr(
          r.code === "EMPTY_SOURCE" ? dict.errorEmptySource : dict.error,
        );
        return;
      }
      handleOpenChange(false);
      setSourceId("");
      setIncludeStudents(false);
      router.refresh();
    });
  };

  const canSubmit = sourceId.length > 0 && sourceCohortOptions.length > 0;

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      titleId="copy-sections-title"
      title={dict.title}
      disableClose={pending}
    >
      <div className="space-y-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">{dict.lead}</p>

        <div>
          <Label htmlFor="cp-source">{dict.sourceLabel}</Label>
          <select
            id="cp-source"
            className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            disabled={pending || sourceCohortOptions.length === 0}
          >
            <option value="">{dict.sourcePlaceholder}</option>
            {sourceCohortOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3">
          <input
            id="cp-include-students"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--color-border)]"
            checked={includeStudents}
            onChange={(e) => setIncludeStudents(e.target.checked)}
            disabled={pending}
          />
          <div className="min-w-0">
            <Label htmlFor="cp-include-students" className="cursor-pointer text-sm font-medium">
              {dict.includeStudentsLabel}
            </Label>
            <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.includeStudentsHint}</p>
          </div>
        </div>

        {err ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {err}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" disabled={pending} onClick={() => handleOpenChange(false)}>
            <X className="h-4 w-4 shrink-0" aria-hidden />
            {dict.cancel}
          </Button>
          <Button type="button" isLoading={pending} disabled={pending || !canSubmit} onClick={submit}>
            {!pending ? <Copy className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.submit}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

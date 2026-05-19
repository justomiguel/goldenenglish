"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Save } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Input } from "@/components/atoms/Input";
import { updateAcademicSectionMinAttendanceAction } from "@/app/[locale]/dashboard/admin/academic/sectionMinAttendanceActions";

export interface AcademicSectionMinAttendanceEditorProps {
  locale: string;
  sectionId: string;
  /** NULL = inherit site default. */
  initialSectionOverride: number | null;
  siteDefaultMin: number;
  dict: Dictionary["dashboard"]["academicSectionPage"]["minAttendance"];
}

export function AcademicSectionMinAttendanceEditor({
  locale,
  sectionId,
  initialSectionOverride,
  siteDefaultMin,
  dict,
}: AcademicSectionMinAttendanceEditorProps) {
  const router = useRouter();
  const [value, setValue] = useState(
    initialSectionOverride != null ? String(initialSectionOverride) : "",
  );
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const usingSiteDefault = initialSectionOverride == null;
  const dirty =
    (initialSectionOverride == null && value.trim() !== "") ||
    (initialSectionOverride != null && value.trim() !== String(initialSectionOverride));

  const saveOverride = () => {
    setMsg(null);
    const trimmed = value.trim();
    const n = Number.parseInt(trimmed, 10);
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      setMsg(dict.errorParse);
      return;
    }
    start(async () => {
      const r = await updateAcademicSectionMinAttendanceAction({
        locale,
        sectionId,
        minAttendancePercent: n,
      });
      if (r.ok) {
        setMsg(dict.success);
        router.refresh();
        return;
      }
      setMsg(r.code === "PARSE" ? dict.errorParse : dict.errorSave);
    });
  };

  const resetToSiteDefault = () => {
    setMsg(null);
    start(async () => {
      const r = await updateAcademicSectionMinAttendanceAction({
        locale,
        sectionId,
        minAttendancePercent: null,
      });
      if (r.ok) {
        setValue("");
        setMsg(dict.successReset);
        router.refresh();
        return;
      }
      setMsg(dict.errorSave);
    });
  };

  const hintDefault = dict.hintDefault.replace(/\{\{default\}\}/g, String(siteDefaultMin));

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.lead}</p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hintDefault}</p>
      {usingSiteDefault ? (
        <p className="mt-1 text-xs font-medium text-[var(--color-foreground)]">{dict.usingSiteDefault}</p>
      ) : (
        <p className="mt-1 text-xs font-medium text-[var(--color-foreground)]">
          {dict.usingSectionOverride.replace(/\{\{value\}\}/g, String(initialSectionOverride))}
        </p>
      )}
      <div className="mt-3 space-y-2">
        <Label htmlFor={`sec-min-att-${sectionId}`}>{dict.label}</Label>
        <Input
          id={`sec-min-att-${sectionId}`}
          type="number"
          inputMode="numeric"
          min={0}
          max={100}
          placeholder={String(siteDefaultMin)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={pending}
          className="max-w-[12rem]"
        />
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={pending || !dirty} isLoading={pending} onClick={saveOverride}>
            {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {dict.save}
          </Button>
          {!usingSiteDefault ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={resetToSiteDefault}
            >
              <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
              {dict.resetToSiteDefault}
            </Button>
          ) : null}
        </div>
        {msg ? (
          <p className="text-sm text-[var(--color-foreground)]" role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </section>
  );
}

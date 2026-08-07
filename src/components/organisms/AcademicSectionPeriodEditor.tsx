"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { SectionPeriodFields } from "@/components/molecules/SectionPeriodFields";
import { updateAcademicSectionPeriodAction } from "@/app/[locale]/dashboard/admin/academic/sectionPeriodActions";

export interface AcademicSectionPeriodEditorProps {
  locale: string;
  sectionId: string;
  initialStartsOn: string;
  initialEndsOn: string;
  dict: Dictionary["dashboard"]["academicSectionPage"]["period"];
  embedded?: boolean;
}

export function AcademicSectionPeriodEditor({
  locale,
  sectionId,
  initialStartsOn,
  initialEndsOn,
  dict,
  embedded = false,
}: AcademicSectionPeriodEditorProps) {
  const router = useRouter();
  const [startsOn, setStartsOn] = useState(initialStartsOn);
  const [endsOn, setEndsOn] = useState(initialEndsOn);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const fieldsDict = {
    startsLabel: dict.startsLabel,
    endsLabel: dict.endsLabel,
  };

  const save = () => {
    setMsg(null);
    start(async () => {
      const r = await updateAcademicSectionPeriodAction({
        locale,
        sectionId,
        startsOn,
        endsOn,
      });
      if (r.ok) {
        setMsg(dict.success);
        router.refresh();
        return;
      }
      const err =
        r.code === "ORDER"
          ? dict.errorOrder
          : r.code === "PARSE"
            ? dict.errorParse
            : dict.errorSave;
      setMsg(err);
    });
  };

  const dirty = startsOn !== initialStartsOn || endsOn !== initialEndsOn;

  const containerClassName = embedded
    ? ""
    : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4";

  return (
    <div className={containerClassName}>
      {!embedded ? (
        <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
      ) : null}
      <div className="mt-3 space-y-3">
        <SectionPeriodFields
          idPrefix="sec-period"
          startsOn={startsOn}
          endsOn={endsOn}
          onChange={({ startsOn: s, endsOn: e }) => {
            setStartsOn(s);
            setEndsOn(e);
          }}
          dict={fieldsDict}
          disabled={pending}
        />
        <Button type="button" disabled={pending || !dirty} isLoading={pending} onClick={save}>
          {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
          {dict.save}
        </Button>
        {msg ? (
          <p className="text-sm text-[var(--color-foreground)]" role="status">
            {msg}
          </p>
        ) : null}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
}

export function AcademicSectionPeriodEditor({
  locale,
  sectionId,
  initialStartsOn,
  initialEndsOn,
  dict,
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

  return (
    <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-base font-semibold text-[var(--color-primary)]">{dict.title}</h2>
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

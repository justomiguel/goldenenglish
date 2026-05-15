"use client";

import { landingBlockHasField } from "@/lib/cms/landingBlockKindFields";
import type { LandingBlockKind } from "@/types/theming";

export interface BlockLocaleTripleDraft {
  titleEs: string;
  titleEn: string;
  titlePt: string;
  bodyEs: string;
  bodyEn: string;
  bodyPt: string;
}

export interface BlockLocaleTripleLabels {
  titleEs: string;
  titleEn: string;
  titlePt: string;
  bodyEs: string;
  bodyEn: string;
  bodyPt: string;
}

export interface LandingBlockLocaleTripleInputsProps {
  kind: LandingBlockKind;
  draft: BlockLocaleTripleDraft;
  labels: BlockLocaleTripleLabels;
  onPatch: (patch: Partial<BlockLocaleTripleDraft>) => void;
}

export function LandingBlockLocaleTripleInputs({
  kind,
  draft,
  labels,
  onPatch,
}: LandingBlockLocaleTripleInputsProps) {
  const showTitle = landingBlockHasField(kind, "title");
  const showBody = landingBlockHasField(kind, "body");
  return (
    <>
      {showTitle ? (
        <>
          <RowField
            label={labels.titleEs}
            value={draft.titleEs}
            onChange={(v) => onPatch({ titleEs: v })}
          />
          <RowField
            label={labels.titleEn}
            value={draft.titleEn}
            onChange={(v) => onPatch({ titleEn: v })}
          />
          <RowField
            label={labels.titlePt}
            value={draft.titlePt}
            onChange={(v) => onPatch({ titlePt: v })}
          />
        </>
      ) : null}
      {showBody ? (
        <>
          <RowTextarea
            label={labels.bodyEs}
            value={draft.bodyEs}
            onChange={(v) => onPatch({ bodyEs: v })}
          />
          <RowTextarea
            label={labels.bodyEn}
            value={draft.bodyEn}
            onChange={(v) => onPatch({ bodyEn: v })}
          />
          <RowTextarea
            label={labels.bodyPt}
            value={draft.bodyPt}
            onChange={(v) => onPatch({ bodyPt: v })}
          />
        </>
      ) : null}
    </>
  );
}

function RowField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold">{label}</span>
      <input
        type="text"
        value={value}
        maxLength={120}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5"
      />
    </label>
  );
}

function RowTextarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-semibold">{label}</span>
      <textarea
        value={value}
        maxLength={600}
        rows={3}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5"
      />
    </label>
  );
}

"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { landingBlockHasField } from "@/lib/cms/landingBlockKindFields";
import type { Dictionary } from "@/types/i18n";
import type { LandingBlockKind } from "@/types/theming";
import { LANDING_BLOCK_KINDS } from "@/types/theming";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"]["blocks"];

export interface LandingBlockAddFormDraft {
  kind: LandingBlockKind;
  titleEs: string;
  titleEn: string;
  bodyEs: string;
  bodyEn: string;
}

export function emptyAddFormDraft(): LandingBlockAddFormDraft {
  return { kind: "card", titleEs: "", titleEn: "", bodyEs: "", bodyEn: "" };
}

export interface LandingBlockAddFormProps {
  labels: Labels;
  draft: LandingBlockAddFormDraft;
  pending: boolean;
  onChange: (draft: LandingBlockAddFormDraft) => void;
  onSubmit: () => void;
}

export function LandingBlockAddForm({
  labels,
  draft,
  pending,
  onChange,
  onSubmit,
}: LandingBlockAddFormProps) {
  function patch(update: Partial<LandingBlockAddFormDraft>) {
    onChange({ ...draft, ...update });
  }

  return (
    <fieldset
      disabled={pending}
      className="space-y-3 rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] p-3"
    >
      <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
        {labels.addTitle}
      </legend>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-semibold">{labels.kindLabel}</span>
        <select
          value={draft.kind}
          onChange={(e) => patch({ kind: e.target.value as LandingBlockKind })}
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-1.5"
        >
          {LANDING_BLOCK_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {labels.kindOptions[kind]}
            </option>
          ))}
        </select>
      </label>
      {landingBlockHasField(draft.kind, "title") ? (
        <>
          <DraftField
            label={labels.titleEsLabel}
            value={draft.titleEs}
            onChange={(v) => patch({ titleEs: v })}
          />
          <DraftField
            label={labels.titleEnLabel}
            value={draft.titleEn}
            onChange={(v) => patch({ titleEn: v })}
          />
        </>
      ) : null}
      {landingBlockHasField(draft.kind, "body") ? (
        <>
          <DraftTextarea
            label={labels.bodyEsLabel}
            value={draft.bodyEs}
            onChange={(v) => patch({ bodyEs: v })}
          />
          <DraftTextarea
            label={labels.bodyEnLabel}
            value={draft.bodyEn}
            onChange={(v) => patch({ bodyEn: v })}
          />
        </>
      ) : null}
      <Button
        variant="primary"
        size="sm"
        disabled={pending}
        isLoading={pending}
        onClick={onSubmit}
      >
        {!pending ? (
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
        ) : null}
        {labels.submitAddCta}
      </Button>
    </fieldset>
  );
}

function DraftField({
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

function DraftTextarea({
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

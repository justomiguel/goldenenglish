"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import type { LandingBlockKind } from "@/types/theming";
import { LANDING_BLOCK_KINDS } from "@/types/theming";
import {
  LandingBlockLocaleTripleInputs,
  type BlockLocaleTripleDraft,
} from "./LandingBlockLocaleTripleInputs";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"]["blocks"];

export interface LandingBlockAddFormDraft {
  kind: LandingBlockKind;
  titleEs: string;
  titleEn: string;
  titlePt: string;
  bodyEs: string;
  bodyEn: string;
  bodyPt: string;
}

export function emptyAddFormDraft(): LandingBlockAddFormDraft {
  return {
    kind: "card",
    titleEs: "",
    titleEn: "",
    titlePt: "",
    bodyEs: "",
    bodyEn: "",
    bodyPt: "",
  };
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

  const tripleDraft: BlockLocaleTripleDraft = {
    titleEs: draft.titleEs,
    titleEn: draft.titleEn,
    titlePt: draft.titlePt,
    bodyEs: draft.bodyEs,
    bodyEn: draft.bodyEn,
    bodyPt: draft.bodyPt,
  };

  const tripleLabels = {
    titleEs: labels.titleEsLabel,
    titleEn: labels.titleEnLabel,
    titlePt: labels.titlePtLabel,
    bodyEs: labels.bodyEsLabel,
    bodyEn: labels.bodyEnLabel,
    bodyPt: labels.bodyPtLabel,
  };

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
      <LandingBlockLocaleTripleInputs
        kind={draft.kind}
        draft={tripleDraft}
        labels={tripleLabels}
        onPatch={(p) => patch(p)}
      />
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

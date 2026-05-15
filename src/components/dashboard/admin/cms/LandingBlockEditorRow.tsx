"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { isLandingBlockCopyValid } from "@/lib/cms/landingBlockKindFields";
import type { Dictionary } from "@/types/i18n";
import type { LandingBlock } from "@/types/theming";
import {
  LandingBlockLocaleTripleInputs,
  type BlockLocaleTripleDraft,
} from "./LandingBlockLocaleTripleInputs";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"]["blocks"];

export interface PersistedCopy {
  es: { title?: string; body?: string };
  en: { title?: string; body?: string };
  pt: { title?: string; body?: string };
}

export interface LandingBlockEditorRowProps {
  block: LandingBlock;
  labels: Labels;
  disabled: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onSave: (copy: PersistedCopy) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
}

function buildDraft(block: LandingBlock): BlockLocaleTripleDraft {
  return {
    titleEs: block.copy.es.title ?? "",
    titleEn: block.copy.en.title ?? "",
    titlePt: block.copy.pt.title ?? "",
    bodyEs: block.copy.es.body ?? "",
    bodyEn: block.copy.en.body ?? "",
    bodyPt: block.copy.pt.body ?? "",
  };
}

function isDirty(block: LandingBlock, draft: BlockLocaleTripleDraft) {
  const original = buildDraft(block);
  return (
    original.titleEs !== draft.titleEs ||
    original.titleEn !== draft.titleEn ||
    original.titlePt !== draft.titlePt ||
    original.bodyEs !== draft.bodyEs ||
    original.bodyEn !== draft.bodyEn ||
    original.bodyPt !== draft.bodyPt
  );
}

function toPersisted(draft: BlockLocaleTripleDraft): PersistedCopy {
  return {
    es: {
      title: draft.titleEs.trim() || undefined,
      body: draft.bodyEs.trim() || undefined,
    },
    en: {
      title: draft.titleEn.trim() || undefined,
      body: draft.bodyEn.trim() || undefined,
    },
    pt: {
      title: draft.titlePt.trim() || undefined,
      body: draft.bodyPt.trim() || undefined,
    },
  };
}

export function LandingBlockEditorRow({
  block,
  labels,
  disabled,
  canMoveUp,
  canMoveDown,
  onSave,
  onRemove,
  onMove,
}: LandingBlockEditorRowProps) {
  const [draft, setDraft] = useState<BlockLocaleTripleDraft>(() =>
    buildDraft(block),
  );
  const dirty = isDirty(block, draft);
  const persisted = toPersisted(draft);
  const canSave = dirty && isLandingBlockCopyValid(block.kind, persisted);

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
      disabled={disabled}
      className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          {labels.kindOptions[block.kind]}
        </legend>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={disabled || !canMoveUp}
            onClick={() => onMove(-1)}
            aria-label={labels.moveUpCta}
            title={labels.moveUpCta}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowUp aria-hidden className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={disabled || !canMoveDown}
            onClick={() => onMove(1)}
            aria-label={labels.moveDownCta}
            title={labels.moveDownCta}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-foreground)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ArrowDown aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </div>
      <LandingBlockLocaleTripleInputs
        kind={block.kind}
        draft={draft}
        labels={tripleLabels}
        onPatch={(patch) => setDraft((d) => ({ ...d, ...patch }))}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={disabled || !canSave}
          onClick={() => onSave(persisted)}
        >
          <Save className="h-4 w-4 shrink-0" aria-hidden />
          {labels.saveCta}
        </Button>
        <Button variant="ghost" size="sm" disabled={disabled} onClick={onRemove}>
          <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
          {labels.removeCta}
        </Button>
      </div>
    </fieldset>
  );
}

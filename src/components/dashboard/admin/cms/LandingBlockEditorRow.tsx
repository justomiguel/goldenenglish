"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  isLandingBlockCopyValid,
  landingBlockHasField,
} from "@/lib/cms/landingBlockKindFields";
import type { Dictionary } from "@/types/i18n";
import type { LandingBlock } from "@/types/theming";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"]["blocks"];

interface DraftCopy {
  titleEs: string;
  titleEn: string;
  bodyEs: string;
  bodyEn: string;
}

export interface PersistedCopy {
  es: { title?: string; body?: string };
  en: { title?: string; body?: string };
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

function buildDraft(block: LandingBlock): DraftCopy {
  return {
    titleEs: block.copy.es.title ?? "",
    titleEn: block.copy.en.title ?? "",
    bodyEs: block.copy.es.body ?? "",
    bodyEn: block.copy.en.body ?? "",
  };
}

function isDirty(block: LandingBlock, draft: DraftCopy) {
  const original = buildDraft(block);
  return (
    original.titleEs !== draft.titleEs ||
    original.titleEn !== draft.titleEn ||
    original.bodyEs !== draft.bodyEs ||
    original.bodyEn !== draft.bodyEn
  );
}

function toPersisted(draft: DraftCopy): PersistedCopy {
  return {
    es: {
      title: draft.titleEs.trim() || undefined,
      body: draft.bodyEs.trim() || undefined,
    },
    en: {
      title: draft.titleEn.trim() || undefined,
      body: draft.bodyEn.trim() || undefined,
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
  const [draft, setDraft] = useState<DraftCopy>(() => buildDraft(block));
  const dirty = isDirty(block, draft);
  const persisted = toPersisted(draft);
  const canSave = dirty && isLandingBlockCopyValid(block.kind, persisted);
  const showTitle = landingBlockHasField(block.kind, "title");
  const showBody = landingBlockHasField(block.kind, "body");

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
      {showTitle ? (
        <>
          <RowField
            label={labels.titleEsLabel}
            value={draft.titleEs}
            onChange={(v) => setDraft((d) => ({ ...d, titleEs: v }))}
          />
          <RowField
            label={labels.titleEnLabel}
            value={draft.titleEn}
            onChange={(v) => setDraft((d) => ({ ...d, titleEn: v }))}
          />
        </>
      ) : null}
      {showBody ? (
        <>
          <RowTextarea
            label={labels.bodyEsLabel}
            value={draft.bodyEs}
            onChange={(v) => setDraft((d) => ({ ...d, bodyEs: v }))}
          />
          <RowTextarea
            label={labels.bodyEnLabel}
            value={draft.bodyEn}
            onChange={(v) => setDraft((d) => ({ ...d, bodyEn: v }))}
          />
        </>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={disabled || !canSave}
          onClick={() => onSave(persisted)}
        >
          {labels.saveCta}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onRemove}
        >
          {labels.removeCta}
        </Button>
      </div>
    </fieldset>
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

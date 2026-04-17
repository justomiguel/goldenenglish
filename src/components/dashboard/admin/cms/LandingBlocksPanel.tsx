"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  addLandingBlockAction,
  moveLandingBlockAction,
  removeLandingBlockAction,
  updateLandingBlockAction,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeBlocksActions";
import { isLandingBlockCopyValid } from "@/lib/cms/landingBlockKindFields";
import type { Dictionary } from "@/types/i18n";
import type { LandingBlock, LandingSectionSlug } from "@/types/theming";
import { LANDING_BLOCKS_PER_SECTION_CAP } from "@/types/theming";
import {
  LandingBlockAddForm,
  emptyAddFormDraft,
  type LandingBlockAddFormDraft,
} from "./LandingBlockAddForm";
import {
  LandingBlockEditorRow,
  type PersistedCopy,
} from "./LandingBlockEditorRow";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"]["blocks"];
type ErrorCode =
  | "invalid_input"
  | "forbidden"
  | "not_found"
  | "persist_failed"
  | "block_empty";

export interface LandingBlocksPanelProps {
  locale: string;
  themeId: string;
  section: LandingSectionSlug;
  blocks: ReadonlyArray<LandingBlock>;
  labels: Labels;
}

function draftToCopy(draft: LandingBlockAddFormDraft): PersistedCopy {
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


export function LandingBlocksPanel({
  locale,
  themeId,
  section,
  blocks,
  labels,
}: LandingBlocksPanelProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<LandingBlockAddFormDraft>(() =>
    emptyAddFormDraft(),
  );
  const [adding, setAdding] = useState(false);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [pending, startTransition] = useTransition();

  const atCap = blocks.length >= LANDING_BLOCKS_PER_SECTION_CAP;

  function handleAdd() {
    const copy = draftToCopy(draft);
    if (!isLandingBlockCopyValid(draft.kind, copy)) {
      setErrorCode("block_empty");
      return;
    }
    setErrorCode(null);
    startTransition(async () => {
      const result = await addLandingBlockAction({
        locale,
        id: themeId,
        section,
        kind: draft.kind,
        copy,
      });
      if (!result.ok) {
        setErrorCode(result.code as ErrorCode);
        return;
      }
      setAdding(false);
      setDraft(emptyAddFormDraft());
      router.refresh();
    });
  }

  function handleRemove(blockId: string) {
    if (!window.confirm(labels.confirmRemove)) return;
    startTransition(async () => {
      const result = await removeLandingBlockAction({
        locale,
        id: themeId,
        blockId,
      });
      if (!result.ok) {
        setErrorCode(result.code as ErrorCode);
        return;
      }
      router.refresh();
    });
  }

  function handleMove(blockId: string, direction: -1 | 1) {
    setErrorCode(null);
    startTransition(async () => {
      const result = await moveLandingBlockAction({
        locale,
        id: themeId,
        blockId,
        direction,
      });
      if (!result.ok) {
        setErrorCode(result.code as ErrorCode);
        return;
      }
      router.refresh();
    });
  }

  function handleUpdate(blockId: string, copy: PersistedCopy) {
    setErrorCode(null);
    startTransition(async () => {
      const result = await updateLandingBlockAction({
        locale,
        id: themeId,
        blockId,
        copy,
      });
      if (!result.ok) {
        setErrorCode(result.code as ErrorCode);
        return;
      }
      router.refresh();
    });
  }

  return (
    <article className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {labels.title}
          </h2>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {labels.lead}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={pending || atCap}
          onClick={() => {
            setAdding((prev) => !prev);
            setErrorCode(null);
          }}
        >
          <Plus aria-hidden className="mr-1 h-4 w-4" />
          {labels.addCta}
        </Button>
      </header>

      {errorCode ? (
        <p
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {errorCode === "block_empty"
            ? labels.blockEmpty
            : (labels.errors[errorCode as keyof typeof labels.errors] ??
              labels.errors.persist_failed)}
        </p>
      ) : null}

      {adding ? (
        <LandingBlockAddForm
          labels={labels}
          draft={draft}
          pending={pending}
          onChange={setDraft}
          onSubmit={handleAdd}
        />
      ) : null}

      {blocks.length === 0 ? (
        <p className="rounded-[var(--layout-border-radius)] border border-dashed border-[var(--color-border)] px-3 py-4 text-center text-sm text-[var(--color-muted-foreground)]">
          {labels.emptyState}
        </p>
      ) : (
        <ul className="space-y-3">
          {blocks.map((block, index) => (
            <li key={block.id}>
              <LandingBlockEditorRow
                block={block}
                labels={labels}
                disabled={pending}
                canMoveUp={index > 0}
                canMoveDown={index < blocks.length - 1}
                onSave={(copy) => handleUpdate(block.id, copy)}
                onRemove={() => handleRemove(block.id)}
                onMove={(direction) => handleMove(block.id, direction)}
              />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

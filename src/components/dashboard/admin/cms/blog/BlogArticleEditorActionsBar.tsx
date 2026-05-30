"use client";

import { Save } from "lucide-react";
import { BlogTranslateButton } from "@/components/dashboard/admin/cms/blog/BlogTranslateButton";
import type { BlogLocale } from "@/lib/blog/domain";
import type { Dictionary } from "@/types/i18n";

interface BlogArticleEditorActionsBarProps {
  labels: Dictionary["admin"]["cms"]["blog"]["editor"];
  translateTargets: BlogLocale[];
  busy: boolean;
  articleId?: string;
  hasGoogleKey: boolean;
  msg: string | null;
  onSave: () => void;
  onTranslate: (targetLocale: BlogLocale) => void;
}

export function BlogArticleEditorActionsBar({
  labels,
  translateTargets,
  busy,
  articleId,
  hasGoogleKey,
  msg,
  onSave,
  onTranslate,
}: BlogArticleEditorActionsBarProps) {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:opacity-70"
        >
          <Save aria-hidden className="h-4 w-4" />
          {labels.save}
        </button>
        {translateTargets.map((targetLocale) => (
          <BlogTranslateButton
            key={targetLocale}
            label={labels.translateToLocale.replace("{locale}", labels.localeTabs[targetLocale])}
            disabledLabel={labels.translateMissingKey}
            disabled={busy || !articleId || !hasGoogleKey}
            onClick={() => onTranslate(targetLocale)}
          />
        ))}
      </div>
      {!hasGoogleKey ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.translateManualHint}</p>
      ) : null}
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </>
  );
}

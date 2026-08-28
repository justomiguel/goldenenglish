"use client";

import { Globe, Save } from "lucide-react";
import { BlogTranslateButton } from "@/components/dashboard/admin/cms/blog/BlogTranslateButton";
import type { BlogLocale } from "@/lib/blog/domain";
import type { Dictionary } from "@/types/i18n";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

interface BlogArticleEditorActionsBarProps {
  labels: Dictionary["admin"]["cms"]["blog"]["editor"];
  translateTargets: BlogLocale[];
  busy: boolean;
  articleId?: string;
  hasGoogleKey: boolean;
  msg: string | null;
  onSave: () => void;
  onPublish: () => void;
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
  onPublish,
  onTranslate,
}: BlogArticleEditorActionsBarProps) {
  return (
    <>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          data-tour={ADMIN_TOUR_ANCHORS.blogEditorSave}
          className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-foreground)] disabled:opacity-70"
        >
          <Save aria-hidden className="h-4 w-4" />
          {labels.save}
        </button>
        <button
          type="button"
          onClick={onPublish}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary-foreground)] disabled:opacity-70"
        >
          <Globe aria-hidden className="h-4 w-4" />
          {labels.publish}
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
      {translateTargets.length > 0 && !hasGoogleKey ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.translateManualHint}</p>
      ) : null}
      {msg ? <p className="text-sm text-[var(--color-muted-foreground)]">{msg}</p> : null}
    </>
  );
}

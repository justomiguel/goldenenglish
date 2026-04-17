"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { setSiteThemeKindAction } from "@/app/[locale]/dashboard/admin/cms/siteThemeBlocksActions";
import type { Dictionary } from "@/types/i18n";
import type { SiteThemeKind } from "@/types/theming";
import { SITE_THEME_KINDS } from "@/types/theming";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"]["kindPicker"];

export interface LandingTemplateKindPickerProps {
  locale: string;
  themeId: string;
  current: SiteThemeKind;
  labels: Labels;
}

type ErrorCode = keyof Labels["errors"];

export function LandingTemplateKindPicker({
  locale,
  themeId,
  current,
  labels,
}: LandingTemplateKindPickerProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<SiteThemeKind>(current);
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = draft !== current;

  function handleSave() {
    setErrorCode(null);
    setSavedAt(null);
    startTransition(async () => {
      const result = await setSiteThemeKindAction({
        locale,
        id: themeId,
        kind: draft,
      });
      if (!result.ok) {
        setErrorCode(result.code as ErrorCode);
        return;
      }
      setSavedAt(Date.now());
      router.refresh();
    });
  }

  return (
    <article className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <header className="space-y-1">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">
          {labels.title}
        </h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {labels.lead}
        </p>
      </header>

      {errorCode ? (
        <p
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3 py-2 text-sm text-[var(--color-error)]"
        >
          {labels.errors[errorCode] ?? labels.errors.persist_failed}
        </p>
      ) : null}

      {savedAt && !pending && !errorCode ? (
        <p
          role="status"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 px-3 py-2 text-sm text-[var(--color-success)]"
        >
          {labels.saveSuccess}
        </p>
      ) : null}

      <fieldset
        disabled={pending}
        className="grid gap-2 sm:grid-cols-2"
      >
        <legend className="sr-only">{labels.title}</legend>
        {SITE_THEME_KINDS.map((kind) => {
          const checked = draft === kind;
          return (
            <label
              key={kind}
              className={[
                "flex cursor-pointer items-start gap-2 rounded-[var(--layout-border-radius)] border px-3 py-2 text-sm",
                checked
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5"
                  : "border-[var(--color-border)]",
              ].join(" ")}
            >
              <input
                type="radio"
                name="site-theme-kind"
                value={kind}
                checked={checked}
                onChange={() => setDraft(kind)}
                className="mt-1"
              />
              <span className="font-medium text-[var(--color-foreground)]">
                {labels.options[kind]}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {labels.currentLabel}: <strong>{labels.options[current]}</strong>
        </p>
        <Button
          variant="primary"
          size="sm"
          disabled={pending || !dirty}
          isLoading={pending}
          onClick={handleSave}
        >
          {labels.saveCta}
        </Button>
      </div>
    </article>
  );
}

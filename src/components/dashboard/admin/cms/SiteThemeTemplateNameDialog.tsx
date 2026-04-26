"use client";

import {
  type FormEvent,
  type ReactNode,
  useId,
  useState,
} from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { normalizeThemeSlug } from "@/lib/cms/normalizeThemeSlug";

export interface SiteThemeTemplateNameDialogLabels {
  title: string;
  lead?: string;
  fieldName: string;
  fieldSlug: string;
  fieldSlugHint: string;
  submit: string;
  fieldActivateNow?: string;
}

export interface SiteThemeTemplateNameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labels: SiteThemeTemplateNameDialogLabels;
  /** Pre-filled values when the dialog opens (rename / duplicate). */
  initialName?: string;
  initialSlug?: string;
  /** When true, exposes an "Activate now" checkbox (create only). */
  showActivateToggle?: boolean;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onSubmit: (input: {
    name: string;
    slug: string;
    activate?: boolean;
  }) => void | Promise<void>;
  /** Optional extra content rendered below the form (e.g. cancel hint). */
  footerExtra?: ReactNode;
}

export function SiteThemeTemplateNameDialog({
  open,
  onOpenChange,
  labels,
  initialName = "",
  initialSlug = "",
  showActivateToggle = false,
  errorMessage,
  isSubmitting = false,
  onSubmit,
  footerExtra,
}: SiteThemeTemplateNameDialogProps) {
  const titleId = useId();
  const nameId = useId();
  const slugId = useId();
  const slugHintId = useId();
  const activateId = useId();

  const [name, setName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [slugTouched, setSlugTouched] = useState(Boolean(initialSlug));
  const [activate, setActivate] = useState(false);
  const [openSnapshot, setOpenSnapshot] = useState({
    open,
    name: initialName,
    slug: initialSlug,
  });

  if (
    open &&
    (open !== openSnapshot.open ||
      initialName !== openSnapshot.name ||
      initialSlug !== openSnapshot.slug)
  ) {
    setOpenSnapshot({ open, name: initialName, slug: initialSlug });
    setName(initialName);
    setSlug(initialSlug);
    setSlugTouched(Boolean(initialSlug));
    setActivate(false);
  } else if (!open && openSnapshot.open) {
    setOpenSnapshot({ open, name: initialName, slug: initialSlug });
  }

  function onNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(normalizeThemeSlug(value) ?? "");
    }
  }

  function onSlugChange(value: string) {
    setSlug(value);
    setSlugTouched(true);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;
    void onSubmit({
      name: name.trim(),
      slug: (normalizeThemeSlug(slug) ?? slug).trim(),
      activate: showActivateToggle ? activate : undefined,
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      title={labels.title}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        {labels.lead ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {labels.lead}
          </p>
        ) : null}

        <div className="space-y-1.5">
          <label htmlFor={nameId} className="text-sm font-medium">
            {labels.fieldName}
          </label>
          <input
            id={nameId}
            type="text"
            value={name}
            required
            minLength={2}
            maxLength={80}
            disabled={isSubmitting}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={slugId} className="text-sm font-medium">
            {labels.fieldSlug}
          </label>
          <input
            id={slugId}
            type="text"
            value={slug}
            required
            minLength={2}
            maxLength={64}
            disabled={isSubmitting}
            aria-describedby={slugHintId}
            onChange={(e) => onSlugChange(e.target.value)}
            className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-mono text-[var(--color-foreground)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
          <p
            id={slugHintId}
            className="text-xs text-[var(--color-muted-foreground)]"
          >
            {labels.fieldSlugHint}
          </p>
        </div>

        {showActivateToggle && labels.fieldActivateNow ? (
          <label
            htmlFor={activateId}
            className="flex items-center gap-2 text-sm"
          >
            <input
              id={activateId}
              type="checkbox"
              checked={activate}
              disabled={isSubmitting}
              onChange={(e) => setActivate(e.target.checked)}
            />
            {labels.fieldActivateNow}
          </label>
        ) : null}

        {errorMessage ? (
          <p
            role="alert"
            className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-3 py-2 text-sm text-[var(--color-error)]"
          >
            {errorMessage}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          {footerExtra}
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
            {!isSubmitting ? (
              <Save className="h-4 w-4 shrink-0" aria-hidden />
            ) : null}
            {labels.submit}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

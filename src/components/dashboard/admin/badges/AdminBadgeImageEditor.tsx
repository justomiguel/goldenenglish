"use client";

import { useRef, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  clearBadgeImageAction,
  uploadBadgeImageAction,
} from "@/app/[locale]/dashboard/admin/badges/imageBadgeActions";
import type { Dictionary } from "@/types/i18n";

type AdminBadgesDict = Dictionary["admin"]["badges"];

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 1024 * 1024 * 2;

export interface AdminBadgeImageEditorProps {
  locale: string;
  badgeId: string;
  currentImageUrl: string | null;
  labels: AdminBadgesDict;
  disabled?: boolean;
}

export function AdminBadgeImageEditor(props: AdminBadgeImageEditorProps) {
  const { locale, badgeId, currentImageUrl, labels, disabled } = props;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (file.size > MAX_BYTES || file.size === 0) {
      setError(labels.imageTooLarge);
      e.target.value = "";
      return;
    }
    if (!ACCEPT.split(",").includes(file.type)) {
      setError(labels.imageInvalidMime);
      e.target.value = "";
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("locale", locale);
      fd.append("badgeId", badgeId);
      fd.append("file", file);
      const result = await uploadBadgeImageAction(fd);
      if (e.target) e.target.value = "";
      if (!result.ok) {
        setError(result.message ?? labels.genericError);
        return;
      }
      router.refresh();
    });
  }

  function onClear() {
    setError(null);
    startTransition(async () => {
      const result = await clearBadgeImageAction({ locale, badgeId });
      if (!result.ok) {
        setError(result.message ?? labels.genericError);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={onChange}
          disabled={pending || disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={pending || disabled}
          isLoading={pending}
        >
          <Upload className="h-4 w-4 shrink-0" aria-hidden />
          {labels.uploadCta}
        </Button>
        {currentImageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={pending || disabled}
          >
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
            {labels.clearImageCta}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.tipImage}</p>
      {error ? (
        <p
          role="alert"
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-error)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-error)]"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import {
  clearBadgeImageAction,
  uploadBadgeImageAction,
} from "@/app/[locale]/dashboard/admin/badges/imageBadgeActions";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

type AdminBadgesDict = Dictionary["admin"]["badges"];

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 1024 * 1024 * 2;

export interface AdminBadgeImageEditorProps {
  locale: string;
  badgeId: string;
  currentImageUrl: string | null;
  labels: AdminBadgesDict;
  fileUploadProgress: FileUploadProgressLabels;
  disabled?: boolean;
}

export function AdminBadgeImageEditor(props: AdminBadgeImageEditorProps) {
  const { locale, badgeId, currentImageUrl, labels, fileUploadProgress, disabled } = props;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
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
    const input = e.target;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("locale", locale);
      fd.append("badgeId", badgeId);
      fd.append("file", file);
      const result = await uploadBadgeImageAction(fd);
      input.value = "";
      if (!result.ok) {
        setError(result.message ?? labels.genericError);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function onClear() {
    setError(null);
    setBusy(true);
    try {
      const result = await clearBadgeImageAction({ locale, badgeId });
      if (!result.ok) {
        setError(result.message ?? labels.genericError);
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(ev) => void onChange(ev)}
          disabled={busy || disabled}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={busy || disabled}
          isLoading={busy}
        >
          <Upload className="h-4 w-4 shrink-0" aria-hidden />
          {labels.uploadCta}
        </Button>
        {currentImageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onClear()}
            disabled={busy || disabled}
          >
            <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
            {labels.clearImageCta}
          </Button>
        ) : null}
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">{labels.tipImage}</p>
      {busy ? (
        <InlineUploadProgressBar
          label={fileUploadProgress.progressSending}
          indeterminate
          className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-3"
        />
      ) : null}
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

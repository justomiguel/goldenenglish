"use client";

import { useEffect, useMemo } from "react";
import { Label } from "@/components/atoms/Label";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { isAllowedSectionImageUpload } from "@/lib/register/sectionReferenceImage";

export interface SectionReferenceImageFieldDict {
  photoLabel: string;
  photoHint?: string;
  photoInvalid: string;
}

export function SectionReferenceImageField({
  id,
  file,
  onFileChange,
  dict,
  disabled,
  progress,
}: {
  id: string;
  file: File | null;
  onFileChange: (file: File | null, invalid: boolean) => void;
  dict: SectionReferenceImageFieldDict;
  disabled?: boolean;
  progress?: { label: string; value?: number; indeterminate?: boolean } | null;
}) {
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div>
      <Label htmlFor={id}>{dict.photoLabel}</Label>
      {dict.photoHint ? (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.photoHint}</p>
      ) : null}
      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        className="mt-1 block w-full text-sm text-[var(--color-foreground)]"
        onChange={(e) => {
          const next = e.target.files?.[0] ?? null;
          if (!next) {
            onFileChange(null, false);
            return;
          }
          onFileChange(next, !isAllowedSectionImageUpload(next.type, next.size));
        }}
      />
      {preview ? (
        // Preview of a local File — next/image cannot take blob: URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt=""
          className="mt-2 h-24 w-24 rounded-[var(--layout-border-radius)] object-cover"
        />
      ) : null}
      {progress ? (
        <InlineUploadProgressBar
          className="mt-2"
          label={progress.label}
          value={progress.value}
          indeterminate={progress.indeterminate}
        />
      ) : null}
    </div>
  );
}

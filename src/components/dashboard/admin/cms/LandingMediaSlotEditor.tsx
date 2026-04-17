"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import {
  deleteSiteThemeMediaAction,
  uploadSiteThemeMediaAction,
  type SiteThemeMediaActionExtraCode,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeMediaActions";
import type {
  SiteThemeActionErrorCode,
  SiteThemeActionResult,
} from "@/app/[locale]/dashboard/admin/cms/siteThemeActionShared";
import type { LandingMediaSlotDescriptor } from "@/lib/cms/buildLandingEditorViewModel";
import {
  LANDING_MEDIA_ACCEPTED_MIME,
  LANDING_MEDIA_MAX_BYTES,
  isAcceptedLandingMediaMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";
import { resolveLandingImageSrc } from "@/lib/cms/resolveLandingMedia";
import type { LandingImageSectionSlug } from "@/lib/landing/sectionLandingImages";
import type { LandingSectionSlug } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["admin"]["cms"]["templates"]["landing"];
type ErrorCode =
  | SiteThemeActionErrorCode
  | SiteThemeMediaActionExtraCode
  | "client_too_large"
  | "client_mime";

export interface LandingMediaSlotEditorProps {
  locale: string;
  themeId: string;
  section: LandingSectionSlug;
  slot: LandingMediaSlotDescriptor;
  publicUrlFor: (storagePath: string) => string | null;
  labels: Labels;
  onChanged: () => void;
}

const ACCEPTED_MIME_LIST = LANDING_MEDIA_ACCEPTED_MIME.join(",");

const IMAGE_SECTIONS: ReadonlyArray<LandingImageSectionSlug> = [
  "inicio",
  "historia",
  "modalidades",
  "niveles",
  "certificaciones",
  "oferta",
];

function isImageSection(section: LandingSectionSlug): section is LandingImageSectionSlug {
  return (IMAGE_SECTIONS as ReadonlyArray<string>).includes(section);
}

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("read_failed"));
        return;
      }
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

function errorMessage(labels: Labels, code: ErrorCode): string {
  if (code === "client_too_large") return labels.fileTooLarge;
  if (code === "client_mime") return labels.fileTypeInvalid;
  return labels.errors[code] ?? labels.errors.persist_failed;
}

export function LandingMediaSlotEditor({
  locale,
  themeId,
  section,
  slot,
  publicUrlFor,
  labels,
  onChanged,
}: LandingMediaSlotEditorProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [statusKey, setStatusKey] = useState<"upload" | "delete" | null>(null);

  const overrideUrl = slot.current ? publicUrlFor(slot.current.storagePath) : null;
  const fallbackSrc = isImageSection(section)
    ? resolveLandingImageSrc(section, `${slot.position}.png`)
    : null;
  const previewSrc = overrideUrl ?? fallbackSrc;

  function applyResult(
    result: SiteThemeActionResult | { ok: false; code: SiteThemeMediaActionExtraCode },
    onSuccess: () => void,
  ) {
    if (result.ok) {
      onSuccess();
      onChanged();
      return;
    }
    setErrorCode(result.code);
  }

  function handleFile(file: File) {
    setErrorCode(null);
    setStatusKey(null);
    if (!isAcceptedLandingMediaMime(file.type)) {
      setErrorCode("client_mime");
      return;
    }
    if (file.size > LANDING_MEDIA_MAX_BYTES) {
      setErrorCode("client_too_large");
      return;
    }

    startTransition(async () => {
      try {
        const base64 = await readAsBase64(file);
        const result = await uploadSiteThemeMediaAction({
          locale,
          id: themeId,
          section,
          position: slot.position,
          contentType: file.type,
          fileName: file.name,
          fileBase64: base64,
        });
        applyResult(result, () => {
          setStatusKey("upload");
        });
      } catch {
        setErrorCode("media_payload_invalid");
      }
    });
  }

  function handleDelete() {
    if (!slot.current) return;
    if (!window.confirm(labels.confirmDelete)) return;
    setErrorCode(null);
    setStatusKey(null);
    startTransition(async () => {
      const result = await deleteSiteThemeMediaAction({
        locale,
        id: themeId,
        mediaId: slot.current!.id,
      });
      applyResult(result, () => {
        setStatusKey("delete");
      });
    });
  }

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="flex items-start gap-3">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]">
          {previewSrc ? (
            <Image
              src={previewSrc}
              alt=""
              fill
              sizes="80px"
              className="object-cover"
              unoptimized={Boolean(overrideUrl)}
            />
          ) : null}
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold text-[var(--color-foreground)]">
            {labels.slotPositionLabel.replace("{{position}}", String(slot.position))}
          </p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {slot.current ? labels.overriddenLabel : labels.defaultLabel}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => inputRef.current?.click()}
            >
              <Upload aria-hidden className="mr-1 h-4 w-4" />
              {labels.uploadCta}
            </Button>
            {slot.current ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={handleDelete}
              >
                <Trash2 aria-hidden className="mr-1 h-4 w-4" />
                {labels.deleteCta}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_LIST}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />
      {errorCode ? (
        <p
          role="alert"
          className="mt-2 text-xs text-[var(--color-error)]"
        >
          {errorMessage(labels, errorCode)}
        </p>
      ) : null}
      {!errorCode && statusKey && !pending ? (
        <p role="status" className="mt-2 text-xs text-[var(--color-success)]">
          {statusKey === "upload" ? labels.uploadSuccess : labels.deleteSuccess}
        </p>
      ) : null}
    </div>
  );
}

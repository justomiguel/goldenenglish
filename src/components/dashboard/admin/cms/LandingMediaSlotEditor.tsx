"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { ConfirmActionModal } from "@/components/molecules/ConfirmActionModal";
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
  coerceLandingMediaMime,
} from "@/lib/cms/siteThemeLandingInputSchemas";
import type { LandingSectionSlug } from "@/types/theming";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import { readImageFileAsBase64 } from "@/components/dashboard/admin/site-setup/readImageFileAsBase64";
type Labels = Dictionary["admin"]["cms"]["templates"]["landing"];
type ErrorCode =
  | SiteThemeActionErrorCode
  | SiteThemeMediaActionExtraCode
  | "client_too_large"
  | "client_mime";

type UploadUi =
  | { kind: "idle" }
  | { kind: "busy"; stage: "reading"; readPercent: number }
  | { kind: "busy"; stage: "sending" };

export interface LandingMediaSlotEditorProps {
  locale: string;
  themeId: string;
  section: LandingSectionSlug;
  slot: LandingMediaSlotDescriptor;
  labels: Labels;
  fileUploadProgress: FileUploadProgressLabels;
  onChanged: () => void;
}

const ACCEPTED_MIME_LIST = LANDING_MEDIA_ACCEPTED_MIME.join(",");

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
  labels,
  fileUploadProgress,
  onChanged,
}: LandingMediaSlotEditorProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploadUi, setUploadUi] = useState<UploadUi>({ kind: "idle" });
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [statusKey, setStatusKey] = useState<"upload" | "delete" | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const previewSrc = slot.currentPublicUrl ?? slot.fallbackPublicUrl;
  const hasOverride = Boolean(slot.currentPublicUrl);
  const uploadBusy = uploadUi.kind !== "idle";

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

  async function handleFile(file: File) {
    setErrorCode(null);
    setStatusKey(null);
    const mime = coerceLandingMediaMime(file.type);
    if (!mime) {
      setErrorCode("client_mime");
      return;
    }
    if (file.size > LANDING_MEDIA_MAX_BYTES) {
      setErrorCode("client_too_large");
      return;
    }

    setUploadUi({ kind: "busy", stage: "reading", readPercent: 0 });
    try {
      const data = await readImageFileAsBase64(file, {
        onProgress: (r) =>
          setUploadUi({
            kind: "busy",
            stage: "reading",
            readPercent: Math.round(r * 100),
          }),
      });
      setUploadUi({ kind: "busy", stage: "sending" });
      const result = await uploadSiteThemeMediaAction({
        locale,
        id: themeId,
        section,
        position: slot.position,
        contentType: mime,
        fileName: file.name,
        fileBase64: data.base64,
      });
      applyResult(result, () => {
        setStatusKey("upload");
      });
    } catch {
      setErrorCode("media_payload_invalid");
    } finally {
      setUploadUi({ kind: "idle" });
    }
  }

  function runDeleteMedia() {
    if (!slot.current) return;
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
              unoptimized={hasOverride}
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
              disabled={pending || uploadBusy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload aria-hidden className="h-4 w-4 shrink-0" />
              {labels.uploadCta}
            </Button>
            {slot.current ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending || uploadBusy}
                onClick={() => setDeleteConfirmOpen(true)}
              >
                <Trash2 aria-hidden className="h-4 w-4 shrink-0" />
                {labels.deleteCta}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {uploadUi.kind === "busy" ? (
        <InlineUploadProgressBar
          className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/15 px-3 py-3"
          label={
            uploadUi.stage === "reading"
              ? fileUploadProgress.progressReading
              : fileUploadProgress.progressSending
          }
          {...(uploadUi.stage === "reading"
            ? { value: uploadUi.readPercent, indeterminate: false }
            : { indeterminate: true })}
        />
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_MIME_LIST}
        className="hidden"
        disabled={pending || uploadBusy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
      {errorCode ? (
        <p role="alert" className="mt-2 text-xs text-[var(--color-error)]">
          {errorMessage(labels, errorCode)}
        </p>
      ) : null}
      {!errorCode && statusKey && !pending && !uploadBusy ? (
        <p role="status" className="mt-2 text-xs text-[var(--color-success)]">
          {statusKey === "upload" ? labels.uploadSuccess : labels.deleteSuccess}
        </p>
      ) : null}

      <ConfirmActionModal
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={labels.restoreImageModalTitle}
        description={labels.confirmDelete}
        cancelLabel={labels.restoreImageModalCancel}
        confirmLabel={labels.restoreImageModalConfirm}
        confirmVariant="destructive"
        busy={pending}
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          runDeleteMedia();
        }}
      />
    </div>
  );
}

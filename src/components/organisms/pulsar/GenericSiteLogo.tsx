"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { uploadSiteThemeLogoFromEditorAction } from "@/app/[locale]/dashboard/admin/cms/siteThemeBrandAssetActions";
import { Button } from "@/components/atoms/Button";
import { readImageFileAsBase64 } from "@/components/dashboard/admin/site-setup/readImageFileAsBase64";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

export function GenericSiteLogo({
  locale,
  themeId,
  logoUrl,
  labels,
  fileUploadProgress,
}: {
  locale: string;
  themeId: string;
  logoUrl: string;
  labels: { title: string; lead: string; save: string; saved: string; failed: string };
  fileUploadProgress: FileUploadProgressLabels;
}) {
  const router = useRouter();
  const [file, setFile] = useState<{ base64: string; mime: string } | null>(null);
  const [preview, setPreview] = useState(logoUrl);
  const [readProgress, setReadProgress] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  async function onFile(next: File | undefined) {
    if (!next) return;
    setError(false);
    setSaved(false);
    setReadProgress(0);
    try {
      const read = await readImageFileAsBase64(next, {
        onProgress: (value) => setReadProgress(Math.round(value * 100)),
      });
      setFile(read);
      setPreview(`data:${read.mime};base64,${read.base64}`);
    } catch {
      setFile(null);
      setError(true);
    } finally {
      setReadProgress(null);
    }
  }

  async function onSave() {
    if (!file) return;
    setSending(true);
    setError(false);
    setSaved(false);
    const result = await uploadSiteThemeLogoFromEditorAction({
      locale,
      id: themeId,
      contentType: file.mime,
      fileBase64: file.base64,
    });
    setSending(false);
    if (!result.ok) {
      setError(true);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  const busy = readProgress !== null || sending;

  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-lg font-medium">{labels.title}</h2>
      <p className="text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      {preview ? <img src={preview} alt="" className="h-16 w-16 object-contain" /> : null}
      <label className="block text-sm font-semibold" htmlFor="site-logo">
        {labels.title}
        <input
          id="site-logo"
          name="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-1 block w-full text-base"
          onChange={(event) => void onFile(event.target.files?.[0])}
        />
      </label>
      {busy ? (
        <InlineUploadProgressBar
          label={sending ? fileUploadProgress.progressSending : fileUploadProgress.progressReading}
          {...(sending ? { indeterminate: true } : { value: readProgress ?? 0 })}
        />
      ) : null}
      {saved ? <p className="text-sm text-[var(--color-foreground)]">{labels.saved}</p> : null}
      {error ? <p className="text-sm text-[var(--color-error)]">{labels.failed}</p> : null}
      <Button type="button" isLoading={sending} disabled={!file} onClick={() => void onSave()}>
        <ImagePlus className="h-4 w-4" aria-hidden />
        {labels.save}
      </Button>
    </section>
  );
}

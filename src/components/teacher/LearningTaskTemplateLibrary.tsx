"use client";

import { Link2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { InlineUploadProgressBar } from "@/components/molecules/InlineUploadProgressBar";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import {
  addTemplateEmbedAction,
  saveContentTemplateAction,
  uploadTemplateFileAction,
} from "@/app/[locale]/dashboard/teacher/tasks/actions";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import { readFileAsDataUrlBase64 } from "@/lib/client/readFileAsDataUrlBase64";
import { validateLearningTaskFile } from "@/lib/learning-tasks/assets";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

interface LearningTaskTemplateLibraryProps {
  locale: string;
  templates: ContentTemplateLibraryRow[];
  labels: Dictionary["dashboard"]["teacherMySections"];
  fileUploadProgress: FileUploadProgressLabels;
}

type FileUploadUi =
  | { kind: "idle" }
  | { kind: "busy"; stage: "reading"; readPercent: number }
  | { kind: "busy"; stage: "sending" };

export function LearningTaskTemplateLibrary({
  locale,
  templates,
  labels,
  fileUploadProgress,
}: LearningTaskTemplateLibraryProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p></p>");
  const [assetTemplateId, setAssetTemplateId] = useState(templates[0]?.id ?? "");
  const [assetLabel, setAssetLabel] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [uploadUi, setUploadUi] = useState<FileUploadUi>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  const fileBusy = uploadUi.kind !== "idle";

  const submit = () => {
    startTransition(async () => {
      const result = await saveContentTemplateAction({ locale, title, bodyHtml });
      if (result.ok) {
        setTitle("");
        setBodyHtml("<p></p>");
        router.refresh();
      }
    });
  };

  async function uploadFile(file: File | null) {
    if (!file || !assetTemplateId || !assetLabel.trim()) return;
    const validation = validateLearningTaskFile(file);
    if (!validation.ok) {
      setFileError(labels.taskTemplateAssetTooLarge);
      return;
    }
    setFileError(null);
    setUploadUi({ kind: "busy", stage: "reading", readPercent: 0 });
    try {
      const data = await readFileAsDataUrlBase64(file, {
        onProgress: (r) =>
          setUploadUi({
            kind: "busy",
            stage: "reading",
            readPercent: Math.round(r * 100),
          }),
      });
      setUploadUi({ kind: "busy", stage: "sending" });
      const result = await uploadTemplateFileAction({
        locale,
        templateId: assetTemplateId,
        label: assetLabel,
        filename: file.name,
        contentType: data.mime || file.type,
        fileBase64: data.base64,
      });
      if (!result.ok) setFileError(labels.taskTemplateAssetUploadFailed);
      else router.refresh();
    } catch {
      setFileError(labels.taskTemplateAssetUploadFailed);
    } finally {
      setUploadUi({ kind: "idle" });
    }
  }

  const addEmbed = () => {
    if (!assetTemplateId || !assetLabel.trim() || !embedUrl.trim()) return;
    startTransition(async () => {
      const result = await addTemplateEmbedAction({
        locale,
        templateId: assetTemplateId,
        label: assetLabel,
        url: embedUrl,
      });
      if (result.ok) {
        setEmbedUrl("");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{labels.taskLibraryTitle}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.taskLibraryLead}</p>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="learning-template-title" required>
              {labels.taskTemplateTitleLabel}
            </Label>
            <Input id="learning-template-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label required>{labels.taskTemplateBodyLabel}</Label>
            <RichTextEditor
              value={bodyHtml}
              onChange={setBodyHtml}
              aria-label={labels.taskTemplateBodyLabel}
            />
          </div>
          <Button type="button" onClick={submit} isLoading={isPending} disabled={!title.trim()}>
            {!isPending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
            {labels.taskTemplateSave}
          </Button>
        </div>
      </section>

      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        {templates.length === 0 ? (
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.taskTemplateEmpty}</p>
        ) : (
          <ul className="space-y-2">
            {templates.map((template) => (
              <li
                key={template.id}
                className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
              >
                <p className="font-semibold text-[var(--color-foreground)]">{template.title}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {new Date(template.updatedAt).toLocaleString(locale)} · {template.assetCount}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {templates.length > 0 ? (
        <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.taskTemplateAssetTitle}</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="block text-sm font-medium text-[var(--color-foreground)]">
              {labels.taskAssignTitle}
              <select
                value={assetTemplateId}
                onChange={(e) => setAssetTemplateId(e.target.value)}
                disabled={fileBusy}
                className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <Label htmlFor="learning-asset-label">{labels.taskTemplateAssetLabel}</Label>
              <Input
                id="learning-asset-label"
                value={assetLabel}
                onChange={(e) => setAssetLabel(e.target.value)}
                disabled={fileBusy}
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="learning-asset-file">{labels.taskTemplateAssetFile}</Label>
              <Input
                id="learning-asset-file"
                type="file"
                disabled={fileBusy}
                onChange={(e) => {
                  void uploadFile(e.target.files?.[0] ?? null);
                  e.target.value = "";
                }}
              />
              {fileError ? <p className="mt-1 text-sm text-[var(--color-error)]">{fileError}</p> : null}
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
            </div>
            <div>
              <Label htmlFor="learning-embed-url">{labels.taskTemplateEmbedUrl}</Label>
              <div className="flex gap-2">
                <Input id="learning-embed-url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} />
                <Button type="button" onClick={addEmbed} isLoading={isPending}>
                  {!isPending ? <Link2 className="h-4 w-4 shrink-0" aria-hidden /> : null}
                  {labels.taskTemplateEmbedAdd}
                </Button>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

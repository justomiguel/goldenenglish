"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import {
  addTemplateEmbedAction,
  saveContentTemplateAction,
  uploadTemplateFileAction,
} from "@/app/[locale]/dashboard/teacher/tasks/actions";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import { validateLearningTaskFile } from "@/lib/learning-tasks/assets";
import type { Dictionary } from "@/types/i18n";

interface LearningTaskTemplateLibraryProps {
  locale: string;
  templates: ContentTemplateLibraryRow[];
  labels: Dictionary["dashboard"]["teacherMySections"];
}

export function LearningTaskTemplateLibrary({
  locale,
  templates,
  labels,
}: LearningTaskTemplateLibraryProps) {
  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p></p>");
  const [assetTemplateId, setAssetTemplateId] = useState(templates[0]?.id ?? "");
  const [assetLabel, setAssetLabel] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await saveContentTemplateAction({ locale, title, bodyHtml });
      if (result.ok) {
        setTitle("");
        setBodyHtml("<p></p>");
      }
    });
  };

  const uploadFile = (file: File | null) => {
    if (!file || !assetTemplateId || !assetLabel.trim()) return;
    const validation = validateLearningTaskFile(file);
    if (!validation.ok) {
      setFileError(labels.taskTemplateAssetTooLarge);
      return;
    }
    setFileError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const fileBase64 = result.includes(",") ? result.split(",")[1] : result;
      startTransition(async () => {
        await uploadTemplateFileAction({
          templateId: assetTemplateId,
          label: assetLabel,
          filename: file.name,
          contentType: file.type,
          fileBase64,
        });
      });
    };
    reader.readAsDataURL(file);
  };

  const addEmbed = () => {
    if (!assetTemplateId || !assetLabel.trim() || !embedUrl.trim()) return;
    startTransition(async () => {
      await addTemplateEmbedAction({ templateId: assetTemplateId, label: assetLabel, url: embedUrl });
      setEmbedUrl("");
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
        <h1 className="text-2xl font-semibold text-[var(--color-foreground)]">{labels.taskLibraryTitle}</h1>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.taskLibraryLead}</p>
        <div className="mt-4 space-y-4">
          <div>
            <Label htmlFor="learning-template-title" required>{labels.taskTemplateTitleLabel}</Label>
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
              <li key={template.id} className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
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
                className="mt-1 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>{template.title}</option>
                ))}
              </select>
            </label>
            <div>
              <Label htmlFor="learning-asset-label">{labels.taskTemplateAssetLabel}</Label>
              <Input id="learning-asset-label" value={assetLabel} onChange={(e) => setAssetLabel(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="learning-asset-file">{labels.taskTemplateAssetFile}</Label>
              <Input id="learning-asset-file" type="file" onChange={(e) => uploadFile(e.target.files?.[0] ?? null)} />
              {fileError ? <p className="mt-1 text-sm text-[var(--color-error)]">{fileError}</p> : null}
            </div>
            <div>
              <Label htmlFor="learning-embed-url">{labels.taskTemplateEmbedUrl}</Label>
              <div className="flex gap-2">
                <Input id="learning-embed-url" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} />
                <Button type="button" onClick={addEmbed} isLoading={isPending}>
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

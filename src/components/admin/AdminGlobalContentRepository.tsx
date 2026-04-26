"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { RichTextEditor } from "@/components/molecules/RichTextEditor";
import {
  addGlobalContentEmbedAction,
  saveGlobalContentAction,
  uploadGlobalContentFileAction,
} from "@/app/[locale]/dashboard/admin/academic/contents/globalContentActions";
import { validateLearningTaskFile } from "@/lib/learning-tasks/assets";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { Dictionary } from "@/types/i18n";

interface AdminGlobalContentRepositoryProps {
  locale: string;
  contents: ContentTemplateLibraryRow[];
  labels: Dictionary["dashboard"]["adminContents"];
}

export function AdminGlobalContentRepository({
  locale,
  contents,
  labels,
}: AdminGlobalContentRepositoryProps) {
  const [createdContentId, setCreatedContentId] = useState(contents[0]?.id ?? "");
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <GlobalContentForm
        locale={locale}
        labels={labels}
        onCreated={setCreatedContentId}
      />
      <RepositoryList
        contents={contents}
        selectedId={createdContentId}
        onSelect={setCreatedContentId}
        labels={labels}
        locale={locale}
      />
      <MaterialManager
        contentId={createdContentId}
        contents={contents}
        labels={labels}
      />
    </div>
  );
}

function GlobalContentForm({
  locale,
  labels,
  onCreated,
}: {
  locale: string;
  labels: Dictionary["dashboard"]["adminContents"];
  onCreated: (id: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bodyHtml, setBodyHtml] = useState("<p></p>");
  const [isPending, startTransition] = useTransition();
  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-foreground)]">{labels.globalCreateTitle}</h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.globalCreateLead}</p>
      </div>
      <div>
        <Label htmlFor="global-content-title" required>{labels.globalTitleLabel}</Label>
        <Input id="global-content-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="global-content-description">{labels.globalDescriptionLabel}</Label>
        <textarea
          id="global-content-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 min-h-20 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <Label required>{labels.globalBodyLabel}</Label>
        <RichTextEditor value={bodyHtml} onChange={setBodyHtml} aria-label={labels.globalBodyLabel} />
      </div>
      <Button
        type="button"
        isLoading={isPending}
        disabled={!title.trim()}
        onClick={() => startTransition(async () => {
          const result = await saveGlobalContentAction({ locale, title, description, bodyHtml });
          if (result.ok) {
            onCreated(result.id);
            setTitle("");
            setDescription("");
            setBodyHtml("<p></p>");
          }
        })}
      >
        {labels.globalSave}
      </Button>
    </section>
  );
}

function RepositoryList({
  contents,
  selectedId,
  onSelect,
  labels,
  locale,
}: {
  contents: ContentTemplateLibraryRow[];
  selectedId: string;
  onSelect: (id: string) => void;
  labels: Dictionary["dashboard"]["adminContents"];
  locale: string;
}) {
  const [query, setQuery] = useState("");
  const visible = useMemo(
    () => contents.filter((item) => `${item.title} ${item.description}`.toLowerCase().includes(query.toLowerCase())),
    [contents, query],
  );
  return (
    <aside className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.repositoryTitle}</h2>
      <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={labels.repositorySearchPlaceholder} />
      {visible.length === 0 ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.repositoryEmpty}</p> : (
        <ul className="space-y-2">
          {visible.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                className={`w-full rounded-[var(--layout-border-radius)] border p-3 text-left transition hover:bg-[var(--color-muted)] ${selectedId === item.id ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5" : "border-[var(--color-border)] bg-[var(--color-background)]"}`}
              >
                <span className="block font-semibold text-[var(--color-foreground)]">{item.title}</span>
                <span className="mt-1 line-clamp-2 block text-xs text-[var(--color-muted-foreground)]">{item.description || labels.noDescription}</span>
                <span className="mt-2 block text-xs text-[var(--color-muted-foreground)]">
                  {new Date(item.updatedAt).toLocaleString(locale)} · {labels.assetCount.replace("{count}", String(item.assetCount))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}

function MaterialManager({
  contentId,
  contents,
  labels,
}: {
  contentId: string;
  contents: ContentTemplateLibraryRow[];
  labels: Dictionary["dashboard"]["adminContents"];
}) {
  const [label, setLabel] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const selected = contents.find((item) => item.id === contentId) ?? null;
  const uploadFile = (file: File | null) => {
    if (!file || !contentId || !label.trim()) return;
    const validation = validateLearningTaskFile(file);
    if (!validation.ok) {
      setFileError(labels.globalFileError);
      return;
    }
    setFileError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const fileBase64 = result.includes(",") ? result.split(",")[1] : result;
      startTransition(() => void uploadGlobalContentFileAction({
        templateId: contentId,
        label,
        filename: file.name,
        contentType: file.type,
        fileBase64,
      }));
    };
    reader.readAsDataURL(file);
  };
  return (
    <section className="space-y-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 xl:col-span-2">
      <h2 className="text-lg font-semibold text-[var(--color-foreground)]">{labels.materialsTitle}</h2>
      {!selected ? <p className="text-sm text-[var(--color-muted-foreground)]">{labels.materialsSelectHint}</p> : (
        <>
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.materialsFor.replace("{title}", selected.title)}</p>
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={labels.materialLabelPlaceholder} />
            <Input type="file" onChange={(e) => uploadFile(e.target.files?.[0] ?? null)} disabled={!label.trim() || isPending} />
            <div className="flex gap-2">
              <Input value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} placeholder={labels.embedUrlPlaceholder} />
              <Button type="button" isLoading={isPending} disabled={!label.trim() || !embedUrl.trim()} onClick={() => startTransition(() => void addGlobalContentEmbedAction({ templateId: contentId, label, url: embedUrl }))}>
                {labels.add}
              </Button>
            </div>
          </div>
          {fileError ? <p className="text-sm text-[var(--color-error)]">{fileError}</p> : null}
          <ul className="grid gap-2 md:grid-cols-2">
            {selected.assets.map((asset) => (
              <li key={asset.id} className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                <span className="font-medium text-[var(--color-foreground)]">{asset.label}</span>
                <span className="ml-2 text-xs text-[var(--color-muted-foreground)]">{asset.kind === "embed" ? labels.embedKind : asset.mimeType}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

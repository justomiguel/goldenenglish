"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { AcademicContentEditor } from "@/components/admin/AcademicContentEditor";
import {
  AdminGlobalContentMaterialsPanel,
  type AdminGlobalDraftMaterial,
} from "@/components/admin/AdminGlobalContentMaterialsPanel";
import {
  cleanupGlobalContentPendingUploadAction,
  saveGlobalContentBuilderMetadataAction,
} from "@/app/[locale]/dashboard/admin/academic/contents/globalContentFormDataActions";
import { performGlobalMaterialFileUpload } from "@/components/admin/performGlobalMaterialFileUpload";
import { validateLearningTaskFile } from "@/lib/learning-tasks/assets";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];

interface AdminGlobalContentBuilderProps {
  locale: string;
  labels: Labels;
  editingContent: ContentTemplateLibraryRow | null;
  onSaved?: (id: string) => void;
}

function mapExistingMaterials(content: ContentTemplateLibraryRow): AdminGlobalDraftMaterial[] {
  return content.assets.map((asset) => ({
    id: asset.id,
    existingAssetId: asset.id,
    kind: asset.kind,
    label: asset.label,
    url: asset.embedUrl ?? undefined,
    contentType: asset.mimeType ?? undefined,
  }));
}

export function AdminGlobalContentBuilder({
  locale,
  labels,
  editingContent,
  onSaved,
}: AdminGlobalContentBuilderProps) {
  const [title, setTitle] = useState(editingContent?.title ?? "");
  const [description, setDescription] = useState(editingContent?.description ?? "");
  const [bodyHtml, setBodyHtml] = useState(editingContent?.bodyHtml ?? "<p></p>");
  const [materials, setMaterials] = useState<AdminGlobalDraftMaterial[]>(
    editingContent ? mapExistingMaterials(editingContent) : [],
  );
  const [materialLabel, setMaterialLabel] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const reset = () => {
    setTitle("");
    setDescription("");
    setBodyHtml("<p></p>");
    setMaterials([]);
    setMaterialLabel("");
    setEmbedUrl("");
  };

  const addEmbed = () => {
    if (!materialLabel.trim() || !embedUrl.trim()) return;
    setMaterials((current) => [
      ...current,
      { id: crypto.randomUUID(), kind: "embed", label: materialLabel.trim(), url: embedUrl.trim() },
    ]);
    setMaterialLabel("");
    setEmbedUrl("");
  };

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const labelBase = materialLabel.trim();
    setIsUploading(true);
    setError(null);
    try {
      for (const file of files) {
        const validation = validateLearningTaskFile(file);
        if (!validation.ok) {
          setError(labels.globalFileError);
          continue;
        }
        const label =
          files.length > 1 && labelBase
            ? `${labelBase} (${file.name})`
            : labelBase || file.name.replace(/\.[^.]+$/, "");
        const uploaded = await performGlobalMaterialFileUpload(file);
        if (!uploaded) {
          setError(labels.globalFileError);
          break;
        }
        setMaterials((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            kind: "file",
            uploadedAssetId: uploaded.assetId,
            storagePath: uploaded.storagePath,
            label,
            filename: file.name,
            contentType: file.type,
            byteSize: file.size,
          },
        ]);
      }
    } finally {
      setIsUploading(false);
      setMaterialLabel("");
    }
  };

  const uploadInlineImage = async (file: File) => {
    const validation = validateLearningTaskFile(file);
    if (!validation.ok || !file.type.startsWith("image/")) {
      setError(labels.globalFileError);
      return null;
    }
    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await performGlobalMaterialFileUpload(file);
      if (!uploaded) {
        setError(labels.globalFileError);
        return null;
      }
      const label = file.name.replace(/\.[^.]+$/, "");
      setMaterials((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          kind: "file",
          uploadedAssetId: uploaded.assetId,
          storagePath: uploaded.storagePath,
          label,
          filename: file.name,
          contentType: file.type,
          byteSize: file.size,
        },
      ]);
      return {
        src: `/api/admin/academic/content-assets?path=${encodeURIComponent(uploaded.storagePath)}`,
        alt: label,
      };
    } finally {
      setIsUploading(false);
    }
  };

  const removeMaterial = (material: AdminGlobalDraftMaterial) => {
    setMaterials((current) => current.filter((item) => item.id !== material.id));
    if (!material.existingAssetId && material.storagePath) {
      void cleanupGlobalContentPendingUploadAction({ storagePath: material.storagePath });
    }
  };

  const moveMaterial = (index: number, direction: -1 | 1) => {
    setMaterials((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const save = () => startTransition(async () => {
    const result = await saveGlobalContentBuilderMetadataAction({
      locale,
      id: editingContent?.id,
      title,
      description,
      bodyHtml,
      materials: materials.map((material, index) => ({
        kind: material.kind,
        existingAssetId: material.existingAssetId,
        uploadedAssetId: material.uploadedAssetId,
        storagePath: material.storagePath,
        label: material.label,
        url: material.url,
        filename: material.filename,
        contentType: material.contentType,
        byteSize: material.byteSize,
        sortOrder: index,
      })),
    });
    if (result.ok) {
      if (onSaved) {
        onSaved(result.id);
      } else {
        router.push(`/${locale}/dashboard/admin/academic/contents`);
      }
      if (!editingContent) reset();
    } else {
      setError(labels.globalSaveError);
    }
  });

  return (
    <section className="space-y-5 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-card)]">
      <div>
        <h2 className="text-xl font-semibold text-[var(--color-foreground)]">
          {editingContent ? labels.globalEditTitle : labels.globalCreateTitle}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.globalCreateLead}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="global-content-title" required>{labels.globalTitleLabel}</Label>
          <Input id="global-content-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="global-content-description">{labels.globalDescriptionLabel}</Label>
          <Input id="global-content-description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
      </div>
      <div>
        <Label required>{labels.globalBodyLabel}</Label>
        <AcademicContentEditor value={bodyHtml} onChange={setBodyHtml} onImageUpload={uploadInlineImage} labels={labels} disabled={isUploading} />
      </div>
      <AdminGlobalContentMaterialsPanel labels={labels} materials={materials} materialLabel={materialLabel} embedUrl={embedUrl} isUploading={isUploading} onMaterialLabelChange={setMaterialLabel} onEmbedUrlChange={setEmbedUrl} onAddEmbed={addEmbed} onAddFiles={(files) => void addFiles(files)} onReorderMaterials={setMaterials} onMoveMaterial={moveMaterial} onRemoveMaterial={removeMaterial} />
      {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
      <Button type="button" isLoading={isPending} disabled={!title.trim() || isUploading} onClick={save}>
        {isPending ? null : <Save className="h-4 w-4 shrink-0" aria-hidden />}
        {editingContent ? labels.globalUpdate : labels.globalSave}
      </Button>
    </section>
  );
}

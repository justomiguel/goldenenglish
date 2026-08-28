"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  AdminGlobalContentMaterialsPanel,
  type AdminGlobalDraftMaterial,
} from "@/components/admin/AdminGlobalContentMaterialsPanel";
import { cleanupBlogMediaPendingUploadAction } from "@/app/[locale]/dashboard/admin/cms/blog/actions";
import type { UploadedBlogMediaRef } from "@/components/dashboard/admin/cms/blog/performBlogMediaFileUpload";
import type { ContentMaterialsPanelLabels } from "@/types/contentMaterialsPanelLabels";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

interface BlogArticleMaterialsSectionProps {
  labels: ContentMaterialsPanelLabels;
  fileUploadProgress: FileUploadProgressLabels;
  materials: AdminGlobalDraftMaterial[];
  isUploading: boolean;
  onMaterialsChange: (materials: AdminGlobalDraftMaterial[]) => void;
  onUploadFiles: (
    files: File[],
  ) => Promise<Array<{ file: File; uploaded: UploadedBlogMediaRef } | null>>;
  /** When set, new materials are appended to every locale (not only the active tab). */
  syncMaterialToAllLocales?: (material: AdminGlobalDraftMaterial) => void;
}

export function BlogArticleMaterialsSection({
  labels,
  fileUploadProgress,
  materials,
  isUploading,
  syncMaterialToAllLocales,
  onMaterialsChange,
  onUploadFiles,
}: BlogArticleMaterialsSectionProps) {
  const [materialLabel, setMaterialLabel] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [open, setOpen] = useState(() => materials.length > 0);
  const panelId = useId();

  const pushMaterial = (item: AdminGlobalDraftMaterial) => {
    if (syncMaterialToAllLocales) {
      syncMaterialToAllLocales(item);
      return;
    }
    onMaterialsChange([...materials, item]);
  };

  const addEmbed = () => {
    if (!materialLabel.trim() || !embedUrl.trim()) return;
    pushMaterial({
      id: crypto.randomUUID(),
      kind: "embed",
      label: materialLabel.trim(),
      url: embedUrl.trim(),
    });
    setMaterialLabel("");
    setEmbedUrl("");
  };

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const labelBase = materialLabel.trim();
    const results = await onUploadFiles(files);
    for (const result of results) {
      if (!result) continue;
      const { file, uploaded } = result;
      const label =
        files.length > 1 && labelBase
          ? `${labelBase} (${file.name})`
          : labelBase || file.name.replace(/\.[^.]+$/, "");
      pushMaterial({
        id: crypto.randomUUID(),
        kind: "file",
        storagePath: uploaded.storagePath,
        label,
        filename: file.name,
        contentType: file.type,
        byteSize: file.size,
      });
    }
    setMaterialLabel("");
  };

  const removeMaterial = (material: AdminGlobalDraftMaterial) => {
    onMaterialsChange(materials.filter((item) => item.id !== material.id));
    if (material.storagePath) {
      void cleanupBlogMediaPendingUploadAction({ storagePath: material.storagePath });
    }
  };

  const moveMaterial = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= materials.length) return;
    const next = [...materials];
    [next[index], next[target]] = [next[target], next[index]];
    onMaterialsChange(next);
  };

  const toggleLabel =
    materials.length > 0
      ? `${labels.draftMaterialsTitle} (${materials.length})`
      : labels.draftMaterialsTitle;

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-left text-sm font-semibold text-[var(--color-foreground)] shadow-[var(--shadow-soft)]"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{toggleLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="mt-3 space-y-3">
          <AdminGlobalContentMaterialsPanel
            labels={labels}
            fileInputId="blog-article-materials-file"
            materials={materials}
            materialLabel={materialLabel}
            embedUrl={embedUrl}
            isUploading={isUploading}
            showInlineUploadProgress={false}
            hideHeading
            fileUploadProgress={fileUploadProgress}
            onMaterialLabelChange={setMaterialLabel}
            onEmbedUrlChange={setEmbedUrl}
            onAddEmbed={addEmbed}
            onAddFiles={(files) => void addFiles(files)}
            onReorderMaterials={onMaterialsChange}
            onMoveMaterial={moveMaterial}
            onRemoveMaterial={removeMaterial}
          />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  AdminGlobalContentMaterialsPanel,
  type AdminGlobalDraftMaterial,
} from "@/components/admin/AdminGlobalContentMaterialsPanel";
import { performBlogMediaFileUpload } from "@/components/dashboard/admin/cms/blog/performBlogMediaFileUpload";
import { cleanupBlogMediaPendingUploadAction } from "@/app/[locale]/dashboard/admin/cms/blog/actions";
import { validateLearningTaskFile } from "@/lib/learning-tasks/assets";
import type { ContentMaterialsPanelLabels } from "@/types/contentMaterialsPanelLabels";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

interface BlogArticleMaterialsSectionProps {
  articleId?: string;
  labels: ContentMaterialsPanelLabels;
  fileUploadProgress: FileUploadProgressLabels;
  fileErrorLabel: string;
  materials: AdminGlobalDraftMaterial[];
  onMaterialsChange: (materials: AdminGlobalDraftMaterial[]) => void;
  /** When set, new materials are appended to every locale (not only the active tab). */
  syncMaterialToAllLocales?: (material: AdminGlobalDraftMaterial) => void;
  onError?: (message: string | null) => void;
}

export function BlogArticleMaterialsSection({
  articleId,
  labels,
  fileUploadProgress,
  fileErrorLabel,
  materials,
  syncMaterialToAllLocales,
  onMaterialsChange,
  onError,
}: BlogArticleMaterialsSectionProps) {
  const [materialLabel, setMaterialLabel] = useState("");
  const [embedUrl, setEmbedUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

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
    setIsUploading(true);
    onError?.(null);
    try {
      for (const file of files) {
        const validation = validateLearningTaskFile(file);
        if (!validation.ok) {
          onError?.(fileErrorLabel);
          continue;
        }
        const label =
          files.length > 1 && labelBase
            ? `${labelBase} (${file.name})`
            : labelBase || file.name.replace(/\.[^.]+$/, "");
        const uploaded = await performBlogMediaFileUpload(file, articleId);
        if (!uploaded) {
          onError?.(fileErrorLabel);
          break;
        }
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
    } finally {
      setIsUploading(false);
      setMaterialLabel("");
    }
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

  return (
    <AdminGlobalContentMaterialsPanel
      labels={labels}
      fileInputId="blog-article-materials-file"
      materials={materials}
      materialLabel={materialLabel}
      embedUrl={embedUrl}
      isUploading={isUploading}
      fileUploadProgress={fileUploadProgress}
      onMaterialLabelChange={setMaterialLabel}
      onEmbedUrlChange={setEmbedUrl}
      onAddEmbed={addEmbed}
      onAddFiles={(files) => void addFiles(files)}
      onReorderMaterials={onMaterialsChange}
      onMoveMaterial={moveMaterial}
      onRemoveMaterial={removeMaterial}
    />
  );
}

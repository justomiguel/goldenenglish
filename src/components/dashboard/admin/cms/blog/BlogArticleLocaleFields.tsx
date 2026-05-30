"use client";

import { BlogArticleBodyEditor } from "@/components/dashboard/admin/cms/blog/BlogArticleBodyEditor";
import { BlogArticleMaterialsSection } from "@/components/dashboard/admin/cms/blog/BlogArticleMaterialsSection";
import type { AdminGlobalDraftMaterial } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import type { Dictionary } from "@/types/i18n";
import type { ContentMaterialsPanelLabels } from "@/types/contentMaterialsPanelLabels";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

import type { MediaSyncToAllLocalesPayload } from "@/lib/learning-content/insertAcademicEditorMedia";

interface BlogArticleLocaleFieldsProps {
  labels: Dictionary["admin"]["cms"]["blog"]["editor"];
  academicLabels: Dictionary["dashboard"]["adminContents"];
  materialsLabels: ContentMaterialsPanelLabels;
  fileUploadProgress: FileUploadProgressLabels;
  articleId?: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  materials: AdminGlobalDraftMaterial[];
  onTitleChange: (value: string) => void;
  onExcerptChange: (value: string) => void;
  onBodyHtmlChange: (value: string) => void;
  onMaterialsChange: (materials: AdminGlobalDraftMaterial[]) => void;
  syncMediaToAllLocales: (payload: MediaSyncToAllLocalesPayload) => void;
  syncMaterialToAllLocales?: (material: AdminGlobalDraftMaterial) => void;
  onError: (message: string | null) => void;
}

export function BlogArticleLocaleFields({
  labels,
  academicLabels,
  materialsLabels,
  fileUploadProgress,
  articleId,
  title,
  excerpt,
  bodyHtml,
  materials,
  onTitleChange,
  onExcerptChange,
  onBodyHtmlChange,
  onMaterialsChange,
  syncMediaToAllLocales,
  syncMaterialToAllLocales,
  onError,
}: BlogArticleLocaleFieldsProps) {
  return (
    <div className="grid gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <label className="grid gap-1 text-sm">
        <span className="font-medium">{labels.title}</span>
        <input
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">{labels.excerpt}</span>
        <textarea
          className="min-h-24 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2"
          value={excerpt}
          onChange={(event) => onExcerptChange(event.target.value)}
        />
      </label>
      <BlogArticleBodyEditor
        bodyLabel={labels.body}
        editorLabels={labels}
        academicLabels={academicLabels}
        articleId={articleId}
        bodyHtml={bodyHtml}
        onBodyHtmlChange={onBodyHtmlChange}
        syncMediaToAllLocales={syncMediaToAllLocales}
        onError={onError}
      />
      <BlogArticleMaterialsSection
        articleId={articleId}
        labels={materialsLabels}
        fileUploadProgress={fileUploadProgress}
        fileErrorLabel={labels.fileError}
        materials={materials}
        syncMaterialToAllLocales={syncMaterialToAllLocales}
        onMaterialsChange={onMaterialsChange}
        onError={onError}
      />
    </div>
  );
}

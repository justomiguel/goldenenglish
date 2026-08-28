"use client";

import { BlogArticleBodyEditor } from "@/components/dashboard/admin/cms/blog/BlogArticleBodyEditor";
import { BlogArticleMaterialsSection } from "@/components/dashboard/admin/cms/blog/BlogArticleMaterialsSection";
import { BlockingFileUploadModal } from "@/components/molecules/BlockingFileUploadModal";
import type { AdminGlobalDraftMaterial } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import { useBlogArticleMediaUpload } from "@/hooks/useBlogArticleMediaUpload";
import type { Dictionary } from "@/types/i18n";
import type { ContentMaterialsPanelLabels } from "@/types/contentMaterialsPanelLabels";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

import type { MediaSyncToAllLocalesPayload } from "@/lib/learning-content/insertAcademicEditorMedia";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

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
  const { isUploading, snapshot, uploadOne, uploadMany } = useBlogArticleMediaUpload({
    articleId,
    fileErrorLabel: labels.fileError,
    onError,
  });

  const fileIndex =
    snapshot && snapshot.total > 1
      ? fileUploadProgress.fileIndex
          .replaceAll("{current}", String(snapshot.current))
          .replaceAll("{total}", String(snapshot.total))
      : null;
  const uploading = snapshot?.phase === "uploading";
  const percent = snapshot?.percent ?? null;

  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-[var(--shadow-soft)]">
      <label className="grid gap-1 text-sm" data-tour={ADMIN_TOUR_ANCHORS.blogEditorTitle}>
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
      <div data-tour={ADMIN_TOUR_ANCHORS.blogEditorBody}>
        <BlogArticleBodyEditor
          bodyLabel={labels.body}
          editorLabels={labels}
          academicLabels={academicLabels}
          bodyHtml={bodyHtml}
          onBodyHtmlChange={onBodyHtmlChange}
          onUploadFile={uploadOne}
          onUploadFiles={uploadMany}
          syncMediaToAllLocales={syncMediaToAllLocales}
        />
      </div>
      <BlogArticleMaterialsSection
        labels={materialsLabels}
        fileUploadProgress={fileUploadProgress}
        materials={materials}
        isUploading={isUploading}
        syncMaterialToAllLocales={syncMaterialToAllLocales}
        onMaterialsChange={onMaterialsChange}
        onUploadFiles={uploadMany}
      />
      {snapshot ? (
        <BlockingFileUploadModal
          open
          title={fileUploadProgress.modalTitle}
          filename={snapshot.filename}
          fileIndex={fileIndex}
          phaseLabel={
            uploading
              ? fileUploadProgress.progressSending
              : fileUploadProgress.progressReading
          }
          percent={percent}
          indeterminate={percent === null}
          runningAriaLabel={fileUploadProgress.loadingAria}
        />
      ) : null}
    </div>
  );
}

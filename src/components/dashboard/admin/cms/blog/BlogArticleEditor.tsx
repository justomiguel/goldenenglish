"use client";

import { useMemo, useState } from "react";
import { AdminPageHeader } from "@/components/dashboard/AdminPageHeader";
import { BlogArticleLocaleFields } from "@/components/dashboard/admin/cms/blog/BlogArticleLocaleFields";
import { BlogArticleMetaForm } from "@/components/dashboard/admin/cms/blog/BlogArticleMetaForm";
import { BlogArticleEditorActionsBar } from "@/components/dashboard/admin/cms/blog/BlogArticleEditorActionsBar";
import { BlogArticleAdminShareLinks } from "@/components/dashboard/admin/cms/blog/BlogArticleAdminShareLinks";
import { BlogArticleEditorDeleteControls } from "@/components/dashboard/admin/cms/blog/BlogArticleEditorDeleteControls";
import { useBlogArticleEditorLocales } from "@/hooks/useBlogArticleEditorLocales";
import { useBlogArticleEditorActions } from "@/hooks/useBlogArticleEditorActions";
import { draftMaterialsToBlogAttachments } from "@/lib/blog/mapDraftMaterials";
import { pickBlogMaterialsPanelLabels } from "@/lib/blog/pickBlogMaterialsPanelLabels";
import type { BlogLocale } from "@/lib/blog/domain";
import type { BlogArticleAdminShareLink } from "@/lib/blog/server/resolveBlogArticleAdminShareLinks";
import type { AdminGlobalDraftMaterial } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";

interface BlogArticleEditorProps {
  locale: string;
  pageTitle: string;
  articleId?: string;
  canDelete?: boolean;
  labels: Dictionary["admin"]["cms"]["blog"]["editor"];
  academicLabels: Dictionary["dashboard"]["adminContents"];
  fileUploadProgress: FileUploadProgressLabels;
  initialShareLinks?: BlogArticleAdminShareLink[];
  initial: {
    defaultLocale: BlogLocale;
    status: string;
    tags: string[];
    scheduledFor: string;
    isPinned: boolean;
    hasGoogleKey: boolean;
    translationsByLocale: Partial<
      Record<
        BlogLocale,
        {
          title: string;
          excerpt: string;
          bodyHtml: string;
          materials?: AdminGlobalDraftMaterial[];
        }
      >
    >;
  };
}

export function BlogArticleEditor({
  locale,
  pageTitle,
  articleId,
  canDelete = false,
  labels,
  academicLabels,
  fileUploadProgress,
  initialShareLinks = [],
  initial,
}: BlogArticleEditorProps) {
  const {
    editingLocale,
    title,
    setTitle,
    excerpt,
    setExcerpt,
    bodyHtml,
    setBodyHtml,
    materials,
    setMaterials,
    syncMediaToAllLocales,
    appendMaterialToAllLocales,
    applyTranslatedLocale,
    savableTranslations,
  } = useBlogArticleEditorLocales({
    startLocale: initial.defaultLocale,
    seed: initial.translationsByLocale,
  });

  const [status, setStatus] = useState(initial.status);
  const [tagsCsv, setTagsCsv] = useState(initial.tags.join(", "));
  const [scheduledFor, setScheduledFor] = useState(initial.scheduledFor);
  const [isPinned, setIsPinned] = useState(initial.isPinned);

  const tags = useMemo(
    () =>
      tagsCsv
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsCsv],
  );

  const materialsLabels = useMemo(
    () => pickBlogMaterialsPanelLabels(academicLabels, labels.materials),
    [academicLabels, labels.materials],
  );

  const {
    msg,
    setMsg,
    busy,
    shareLinks,
    deleteOpen,
    setDeleteOpen,
    onSaveDraft,
    onPublish,
    onTranslateWithGoogle,
    onConfirmDelete,
  } = useBlogArticleEditorActions({
    locale,
    articleId,
    labels,
    initial,
    tags,
    isPinned,
    scheduledFor,
    editingLocale,
    title,
    excerpt,
    bodyHtml,
    savableTranslations,
    applyTranslatedLocale,
    draftMaterialsToBlogAttachments,
    initialShareLinks,
    onStatusSaved: setStatus,
  });

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        title={pageTitle}
        iconId="blog"
        tourAnchor={ADMIN_TOUR_ANCHORS.blogEditorRoot}
      />
      <BlogArticleLocaleFields
        labels={labels}
        academicLabels={academicLabels}
        materialsLabels={materialsLabels}
        fileUploadProgress={fileUploadProgress}
        articleId={articleId}
        title={title}
        excerpt={excerpt}
        bodyHtml={bodyHtml}
        materials={materials}
        onTitleChange={setTitle}
        onExcerptChange={setExcerpt}
        onBodyHtmlChange={setBodyHtml}
        onMaterialsChange={setMaterials}
        syncMediaToAllLocales={syncMediaToAllLocales}
        syncMaterialToAllLocales={appendMaterialToAllLocales}
        onError={setMsg}
      />

      <div data-tour={ADMIN_TOUR_ANCHORS.blogEditorMeta}>
        <BlogArticleMetaForm
          labels={{
            status: labels.metaStatus,
            tagsCsv: labels.metaTags,
            scheduledFor: labels.metaScheduled,
            pinned: labels.metaPinned,
          }}
          status={status}
          tagsCsv={tagsCsv}
          scheduledFor={scheduledFor}
          isPinned={isPinned}
          onStatusChange={setStatus}
          onTagsCsvChange={setTagsCsv}
          onScheduledForChange={setScheduledFor}
          onPinnedChange={setIsPinned}
        />
      </div>

      <BlogArticleEditorActionsBar
        labels={labels}
        translateTargets={[]}
        busy={busy}
        articleId={articleId}
        hasGoogleKey={initial.hasGoogleKey}
        msg={msg}
        onSave={() => void onSaveDraft()}
        onPublish={() => void onPublish()}
        onTranslate={(targetLocale) => void onTranslateWithGoogle(targetLocale)}
      />

      {shareLinks.length > 0 ? (
        <BlogArticleAdminShareLinks
          links={shareLinks}
          localeTabLabels={labels.localeTabs}
          title={labels.shareLinksTitle}
          previewHint={labels.shareLinksPreviewHint}
          copyLabel={labels.shareLinksCopy}
          copiedLabel={labels.shareLinksCopied}
          openLabel={labels.shareLinksOpen}
        />
      ) : null}

      {canDelete && articleId ? (
        <BlogArticleEditorDeleteControls
          labels={labels}
          open={deleteOpen}
          busy={busy}
          onOpenChange={setDeleteOpen}
          onConfirm={() => void onConfirmDelete()}
        />
      ) : null}
    </div>
  );
}

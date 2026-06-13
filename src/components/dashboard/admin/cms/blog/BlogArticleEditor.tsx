"use client";

import { useMemo, useState } from "react";
import { BlogArticleLocaleTabs } from "@/components/dashboard/admin/cms/blog/BlogArticleLocaleTabs";
import { BlogArticleLocaleFields } from "@/components/dashboard/admin/cms/blog/BlogArticleLocaleFields";
import { BlogArticleMetaForm } from "@/components/dashboard/admin/cms/blog/BlogArticleMetaForm";
import { BlogArticleEditorActionsBar } from "@/components/dashboard/admin/cms/blog/BlogArticleEditorActionsBar";
import { BlogArticleAdminShareLinks } from "@/components/dashboard/admin/cms/blog/BlogArticleAdminShareLinks";
import { BlogArticleEditorDeleteControls } from "@/components/dashboard/admin/cms/blog/BlogArticleEditorDeleteControls";
import { useBlogArticleEditorLocales } from "@/hooks/useBlogArticleEditorLocales";
import { useBlogArticleEditorActions } from "@/hooks/useBlogArticleEditorActions";
import { otherBlogLocales } from "@/lib/blog/blogEditorTranslationDraft";
import { draftMaterialsToBlogAttachments } from "@/lib/blog/mapDraftMaterials";
import { pickBlogMaterialsPanelLabels } from "@/lib/blog/pickBlogMaterialsPanelLabels";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog/domain";
import type { BlogArticleAdminShareLink } from "@/lib/blog/server/resolveBlogArticleAdminShareLinks";
import type { AdminGlobalDraftMaterial } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

interface BlogArticleEditorProps {
  locale: string;
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
  articleId,
  canDelete = false,
  labels,
  academicLabels,
  fileUploadProgress,
  initialShareLinks = [],
  initial,
}: BlogArticleEditorProps) {
  const startLocale = BLOG_LOCALES.includes(locale as BlogLocale)
    ? (locale as BlogLocale)
    : initial.defaultLocale;

  const {
    editingLocale,
    switchEditingLocale,
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
    localeHasContent,
  } = useBlogArticleEditorLocales({
    startLocale,
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

  const translateTargets = otherBlogLocales(editingLocale);

  const {
    msg,
    setMsg,
    busy,
    shareLinks,
    deleteOpen,
    setDeleteOpen,
    onSave,
    onTranslateWithGoogle,
    onConfirmDelete,
  } = useBlogArticleEditorActions({
    locale,
    articleId,
    labels,
    initial,
    status,
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
  });

  return (
    <div className="grid gap-6">
      <BlogArticleLocaleTabs
        value={editingLocale}
        onChange={switchEditingLocale}
        ariaLabel={labels.localeTabsAria}
        tabLabels={labels.localeTabs}
        localeHasContent={localeHasContent}
      />
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {labels.editingLocaleHint.replace("{locale}", labels.localeTabs[editingLocale])}
      </p>

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

      <BlogArticleEditorActionsBar
        labels={labels}
        translateTargets={translateTargets}
        busy={busy}
        articleId={articleId}
        hasGoogleKey={initial.hasGoogleKey}
        msg={msg}
        onSave={() => void onSave()}
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

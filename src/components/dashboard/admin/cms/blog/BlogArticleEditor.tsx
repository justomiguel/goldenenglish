"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BlogArticleLocaleTabs } from "@/components/dashboard/admin/cms/blog/BlogArticleLocaleTabs";
import { BlogArticleLocaleFields } from "@/components/dashboard/admin/cms/blog/BlogArticleLocaleFields";
import { BlogArticleMetaForm } from "@/components/dashboard/admin/cms/blog/BlogArticleMetaForm";
import { BlogArticleEditorActionsBar } from "@/components/dashboard/admin/cms/blog/BlogArticleEditorActionsBar";
import {
  saveBlogArticleAdminAction,
  translateBlogArticleFieldsAdminAction,
} from "@/app/[locale]/dashboard/admin/cms/blog/actions";
import { useBlogArticleEditorLocales } from "@/hooks/useBlogArticleEditorLocales";
import { otherBlogLocales } from "@/lib/blog/blogEditorTranslationDraft";
import { draftMaterialsToBlogAttachments } from "@/lib/blog/mapDraftMaterials";
import { pickBlogMaterialsPanelLabels } from "@/lib/blog/pickBlogMaterialsPanelLabels";
import { BLOG_LOCALES, type BlogLocale } from "@/lib/blog/domain";
import type { AdminGlobalDraftMaterial } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import type { Dictionary } from "@/types/i18n";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";

interface BlogArticleEditorProps {
  locale: string;
  articleId?: string;
  labels: Dictionary["admin"]["cms"]["blog"]["editor"];
  academicLabels: Dictionary["dashboard"]["adminContents"];
  fileUploadProgress: FileUploadProgressLabels;
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
  labels,
  academicLabels,
  fileUploadProgress,
  initial,
}: BlogArticleEditorProps) {
  const router = useRouter();
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
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  async function onSave() {
    if (savableTranslations.length === 0) {
      setMsg(labels.saveNeedOneLocale);
      return;
    }
    setBusy(true);
    setMsg(null);
    const result = await saveBlogArticleAdminAction({
      locale,
      articleId,
      payload: {
        defaultLocale: initial.defaultLocale,
        status,
        tags,
        commentsEnabled: true,
        isPinned,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        translations: savableTranslations.map((row) => ({
          locale: row.locale,
          slug: row.slug,
          title: row.title,
          excerpt: row.excerpt,
          bodyHtml: row.bodyHtml,
          attachments: draftMaterialsToBlogAttachments(row.materials),
        })),
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMsg(labels.saveError);
      return;
    }
    setMsg(labels.saveSuccess);
    if (!articleId && result.articleId) {
      router.push(`/${locale}/dashboard/admin/cms/blog/${result.articleId}/edit`);
      router.refresh();
      return;
    }
    router.refresh();
  }

  async function onTranslateWithGoogle(targetLocale: BlogLocale) {
    if (!initial.hasGoogleKey) {
      setMsg(labels.translateMissingKey);
      return;
    }
    if (!articleId) {
      setMsg(labels.translateNeedsSave);
      return;
    }

    setBusy(true);
    setMsg(null);
    const response = await translateBlogArticleFieldsAdminAction({
      articleId,
      sourceLocale: editingLocale,
      targetLocale,
      title,
      excerpt,
      bodyHtml,
    });
    setBusy(false);
    if (!response.ok || !response.fields) {
      setMsg(labels.saveError);
      return;
    }
    applyTranslatedLocale(targetLocale, response.fields);
    setMsg(labels.translateSuccess);
  }

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
    </div>
  );
}

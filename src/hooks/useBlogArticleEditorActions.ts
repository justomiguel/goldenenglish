"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteBlogArticleAdminAction,
  saveBlogArticleAdminAction,
} from "@/app/[locale]/dashboard/admin/cms/blog/actions";
import { translateBlogArticleFieldsAdminAction } from "@/app/[locale]/dashboard/admin/cms/blog/blogTranslateAdminActions";
import type { BlogArticleAdminShareLink } from "@/lib/blog/server/resolveBlogArticleAdminShareLinks";
import type { BlogLocale } from "@/lib/blog/domain";
import type { AdminGlobalDraftMaterial } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import type { BlogAttachment } from "@/lib/blog/attachments";
import type { Dictionary } from "@/types/i18n";

interface SavableTranslation {
  locale: BlogLocale;
  slug: string;
  title: string;
  excerpt: string;
  bodyHtml: string;
  materials: AdminGlobalDraftMaterial[];
}

interface UseBlogArticleEditorActionsInput {
  locale: string;
  articleId?: string;
  labels: Dictionary["admin"]["cms"]["blog"]["editor"];
  initial: {
    defaultLocale: BlogLocale;
    hasGoogleKey: boolean;
  };
  status: string;
  tags: string[];
  isPinned: boolean;
  scheduledFor: string;
  editingLocale: BlogLocale;
  title: string;
  excerpt: string;
  bodyHtml: string;
  savableTranslations: SavableTranslation[];
  applyTranslatedLocale: (
    targetLocale: BlogLocale,
    fields: { title: string; excerpt: string; bodyHtml: string },
  ) => void;
  draftMaterialsToBlogAttachments: (materials: AdminGlobalDraftMaterial[]) => BlogAttachment[];
  initialShareLinks: BlogArticleAdminShareLink[];
}

export function useBlogArticleEditorActions(input: UseBlogArticleEditorActionsInput) {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [shareLinks, setShareLinks] = useState(input.initialShareLinks);
  const [deleteOpen, setDeleteOpen] = useState(false);

  async function onSave() {
    if (input.savableTranslations.length === 0) {
      setMsg(input.labels.saveNeedOneLocale);
      return;
    }
    setBusy(true);
    setMsg(null);
    const result = await saveBlogArticleAdminAction({
      locale: input.locale,
      articleId: input.articleId,
      payload: {
        defaultLocale: input.initial.defaultLocale,
        status: input.status,
        tags: input.tags,
        commentsEnabled: true,
        isPinned: input.isPinned,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor).toISOString() : null,
        translations: input.savableTranslations.map((row) => ({
          locale: row.locale,
          slug: row.slug,
          title: row.title,
          excerpt: row.excerpt,
          bodyHtml: row.bodyHtml,
          attachments: input.draftMaterialsToBlogAttachments(row.materials),
        })),
      },
    });
    setBusy(false);
    if (!result.ok) {
      setMsg(input.labels.saveError);
      return;
    }
    setMsg(input.labels.saveSuccess);
    if (result.shareLinks?.length) {
      setShareLinks(result.shareLinks);
    }
    if (!input.articleId && result.articleId) {
      router.push(`/${input.locale}/dashboard/admin/cms/blog/${result.articleId}/edit`);
      router.refresh();
      return;
    }
    router.refresh();
  }

  async function onTranslateWithGoogle(targetLocale: BlogLocale) {
    if (!input.initial.hasGoogleKey) {
      setMsg(input.labels.translateMissingKey);
      return;
    }
    if (!input.articleId) {
      setMsg(input.labels.translateNeedsSave);
      return;
    }

    setBusy(true);
    setMsg(null);
    const response = await translateBlogArticleFieldsAdminAction({
      articleId: input.articleId,
      sourceLocale: input.editingLocale,
      targetLocale,
      title: input.title,
      excerpt: input.excerpt,
      bodyHtml: input.bodyHtml,
    });
    setBusy(false);
    if (!response.ok || !response.fields) {
      setMsg(input.labels.saveError);
      return;
    }
    input.applyTranslatedLocale(targetLocale, response.fields);
    setMsg(input.labels.translateSuccess);
  }

  async function onConfirmDelete() {
    if (!input.articleId) return;
    setBusy(true);
    setMsg(null);
    const result = await deleteBlogArticleAdminAction(input.locale, input.articleId);
    setBusy(false);
    setDeleteOpen(false);
    if (!result.ok) {
      setMsg(input.labels.deleteError);
      return;
    }
    router.push(`/${input.locale}/dashboard/admin/cms/blog`);
    router.refresh();
  }

  return {
    msg,
    setMsg,
    busy,
    shareLinks,
    deleteOpen,
    setDeleteOpen,
    onSave,
    onTranslateWithGoogle,
    onConfirmDelete,
  };
}

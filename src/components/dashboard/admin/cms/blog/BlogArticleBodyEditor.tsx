"use client";

import { useState } from "react";
import { Label } from "@/components/atoms/Label";
import { AcademicContentEditor } from "@/components/admin/AcademicContentEditor";
import { performBlogMediaFileUpload } from "@/components/dashboard/admin/cms/blog/performBlogMediaFileUpload";
import { blogMediaPublicUrl } from "@/lib/blog/blogMedia";
import type { BlogEditorMediaAttachConfig } from "@/lib/blog/blogEditorMediaAttach";
import type { MediaSyncToAllLocalesPayload } from "@/lib/learning-content/insertAcademicEditorMedia";
import { validateLearningTaskFile } from "@/lib/learning-tasks/assets";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import type { Dictionary } from "@/types/i18n";

type EditorLabels = Dictionary["admin"]["cms"]["blog"]["editor"];
type AcademicLabels = Dictionary["dashboard"]["adminContents"];

interface BlogArticleBodyEditorProps {
  bodyLabel: string;
  editorLabels: EditorLabels;
  academicLabels: AcademicLabels;
  articleId?: string;
  bodyHtml: string;
  onBodyHtmlChange: (html: string) => void;
  syncMediaToAllLocales: (payload: MediaSyncToAllLocalesPayload) => void;
  onError?: (message: string | null) => void;
}

export function BlogArticleBodyEditor({
  bodyLabel,
  editorLabels,
  academicLabels,
  articleId,
  bodyHtml,
  onBodyHtmlChange,
  syncMediaToAllLocales,
  onError,
}: BlogArticleBodyEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  const mediaUrl = (storagePath: string) =>
    blogMediaPublicUrl(readSupabasePublicEnv().url, storagePath);

  const uploadMediaFile = async (file: File) => {
    const validation = validateLearningTaskFile(file);
    if (!validation.ok) {
      onError?.(editorLabels.fileError);
      return null;
    }
    setIsUploading(true);
    onError?.(null);
    try {
      const uploaded = await performBlogMediaFileUpload(file, articleId);
      if (!uploaded) {
        onError?.(editorLabels.fileError);
        return null;
      }
      const label = file.name.replace(/\.[^.]+$/, "");
      return {
        src: mediaUrl(uploaded.storagePath),
        label,
        contentType: file.type,
      };
    } finally {
      setIsUploading(false);
    }
  };

  const mediaAttach: BlogEditorMediaAttachConfig = {
    labels: editorLabels.attach,
    onMediaFileUpload: uploadMediaFile,
  };

  return (
    <div>
      <Label required>{bodyLabel}</Label>
      <AcademicContentEditor
        value={bodyHtml}
        onChange={onBodyHtmlChange}
        onImageUpload={async (file) => {
          const uploaded = await uploadMediaFile(file);
          if (!uploaded) return null;
          return { src: uploaded.src, alt: uploaded.label };
        }}
        labels={academicLabels}
        disabled={isUploading}
        mediaAttach={mediaAttach}
        syncMediaToAllLocales={syncMediaToAllLocales}
      />
    </div>
  );
}

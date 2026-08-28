"use client";

import { Label } from "@/components/atoms/Label";
import { AcademicContentEditor } from "@/components/admin/AcademicContentEditor";
import { blogMediaPublicUrl } from "@/lib/blog/blogMedia";
import type { BlogEditorMediaAttachConfig } from "@/lib/blog/blogEditorMediaAttach";
import type { MediaSyncToAllLocalesPayload } from "@/lib/learning-content/insertAcademicEditorMedia";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import type { UploadedBlogMediaRef } from "@/components/dashboard/admin/cms/blog/performBlogMediaFileUpload";
import type { Dictionary } from "@/types/i18n";

type EditorLabels = Dictionary["admin"]["cms"]["blog"]["editor"];
type AcademicLabels = Dictionary["dashboard"]["adminContents"];

interface BlogArticleBodyEditorProps {
  bodyLabel: string;
  editorLabels: EditorLabels;
  academicLabels: AcademicLabels;
  bodyHtml: string;
  onBodyHtmlChange: (html: string) => void;
  onUploadFile: (file: File) => Promise<UploadedBlogMediaRef | null>;
  onUploadFiles: (
    files: File[],
  ) => Promise<Array<{ file: File; uploaded: UploadedBlogMediaRef } | null>>;
  syncMediaToAllLocales: (payload: MediaSyncToAllLocalesPayload) => void;
}

export function BlogArticleBodyEditor({
  bodyLabel,
  editorLabels,
  academicLabels,
  bodyHtml,
  onBodyHtmlChange,
  onUploadFile,
  onUploadFiles,
  syncMediaToAllLocales,
}: BlogArticleBodyEditorProps) {
  const mediaUrl = (storagePath: string) =>
    blogMediaPublicUrl(readSupabasePublicEnv().url, storagePath);

  const toAttached = (file: File, uploaded: UploadedBlogMediaRef) => ({
    src: mediaUrl(uploaded.storagePath),
    label: file.name.replace(/\.[^.]+$/, ""),
    contentType: file.type,
  });

  const uploadMediaFile = async (file: File) => {
    const uploaded = await onUploadFile(file);
    if (!uploaded) return null;
    return toAttached(file, uploaded);
  };

  const uploadMediaFiles = async (files: File[]) => {
    const results = await onUploadFiles(files);
    return files.map((file, index) => {
      const result = results[index];
      return result ? toAttached(result.file, result.uploaded) : null;
    });
  };

  const mediaAttach: BlogEditorMediaAttachConfig = {
    labels: editorLabels.attach,
    onMediaFileUpload: uploadMediaFile,
    onMediaFilesUpload: uploadMediaFiles,
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
        onImagesUpload={async (files) => {
          const uploadedList = await uploadMediaFiles(files);
          return uploadedList.map((uploaded) =>
            uploaded ? { src: uploaded.src, alt: uploaded.label } : null,
          );
        }}
        labels={academicLabels}
        mediaAttach={mediaAttach}
        syncMediaToAllLocales={syncMediaToAllLocales}
      />
    </div>
  );
}

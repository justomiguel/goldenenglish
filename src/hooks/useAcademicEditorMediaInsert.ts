"use client";

import { useCallback } from "react";
import type { Editor } from "@tiptap/core";
import { buildBlogYoutubeInsertHtml } from "@/lib/blog/buildBlogMediaInsertHtml";
import type { BlogEditorMediaAttachConfig } from "@/lib/blog/blogEditorMediaAttach";
import {
  buildUploadedMediaInsertHtml,
  getTopLevelBlockIndex,
  insertUploadedMediaInEditor,
  insertYoutubeInEditor,
  type MediaSyncToAllLocalesPayload,
} from "@/lib/learning-content/insertAcademicEditorMedia";

type UseAcademicEditorMediaInsertArgs = {
  editor: Editor | null;
  onImageUpload: (file: File) => Promise<{ src: string; alt: string } | null>;
  mediaAttach?: BlogEditorMediaAttachConfig;
  syncMediaToAllLocales?: (payload: MediaSyncToAllLocalesPayload) => void;
};

export function useAcademicEditorMediaInsert({
  editor,
  onImageUpload,
  mediaAttach,
  syncMediaToAllLocales,
}: UseAcademicEditorMediaInsertArgs) {
  const addImage = useCallback(async () => {
    if (!editor) return;
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "image/png,image/jpeg,image/webp";
    input.onchange = async () => {
      const blockIndex = getTopLevelBlockIndex(editor);
      const files = input.files ? Array.from(input.files) : [];
      for (const file of files) {
        const uploaded = await onImageUpload(file);
        if (!uploaded) continue;
        const uploadedMedia = {
          url: uploaded.src,
          label: uploaded.alt,
          contentType: file.type || "image/jpeg",
        };
        const insertHtml = buildUploadedMediaInsertHtml(uploadedMedia);
        insertUploadedMediaInEditor(editor, uploadedMedia);
        if (syncMediaToAllLocales) {
          syncMediaToAllLocales({ insertHtml, blockIndex });
        }
      }
    };
    input.click();
  }, [editor, onImageUpload, syncMediaToAllLocales]);

  const addMediaFile = useCallback(async () => {
    if (!editor || !mediaAttach) return;
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept =
      "application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,image/png,image/jpeg,image/webp,audio/mpeg,audio/mp4,audio/wav,audio/webm,video/mp4,video/webm";
    input.onchange = async () => {
      const blockIndex = getTopLevelBlockIndex(editor);
      const files = input.files ? Array.from(input.files) : [];
      for (const file of files) {
        const uploaded = await mediaAttach.onMediaFileUpload(file);
        if (!uploaded) continue;
        const uploadedMedia = {
          url: uploaded.src,
          label: uploaded.label,
          contentType: uploaded.contentType,
        };
        const insertHtml = buildUploadedMediaInsertHtml(uploadedMedia);
        insertUploadedMediaInEditor(editor, uploadedMedia);
        if (syncMediaToAllLocales) {
          syncMediaToAllLocales({ insertHtml, blockIndex });
        }
      }
    };
    input.click();
  }, [editor, mediaAttach, syncMediaToAllLocales]);

  const insertYoutubeFromUrl = useCallback(
    (url: string) => {
      if (!editor) return;
      const blockIndex = getTopLevelBlockIndex(editor);
      const insertHtml = buildBlogYoutubeInsertHtml(url);
      if (!insertHtml) return;
      insertYoutubeInEditor(editor, url);
      if (syncMediaToAllLocales) {
        syncMediaToAllLocales({ insertHtml, blockIndex });
      }
    },
    [editor, syncMediaToAllLocales],
  );

  return { addImage, addMediaFile, insertYoutubeFromUrl };
}

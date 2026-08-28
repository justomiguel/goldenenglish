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
  onImagesUpload?: (
    files: File[],
  ) => Promise<Array<{ src: string; alt: string } | null>>;
  mediaAttach?: BlogEditorMediaAttachConfig;
  syncMediaToAllLocales?: (payload: MediaSyncToAllLocalesPayload) => void;
};

function insertUploaded(
  editor: Editor,
  uploadedMedia: { url: string; label: string; contentType: string },
  syncMediaToAllLocales: ((payload: MediaSyncToAllLocalesPayload) => void) | undefined,
  blockIndex: number,
) {
  const insertHtml = buildUploadedMediaInsertHtml(uploadedMedia);
  insertUploadedMediaInEditor(editor, uploadedMedia);
  if (syncMediaToAllLocales) {
    syncMediaToAllLocales({ insertHtml, blockIndex });
  }
}

export function useAcademicEditorMediaInsert({
  editor,
  onImageUpload,
  onImagesUpload,
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
      if (onImagesUpload) {
        const uploadedList = await onImagesUpload(files);
        uploadedList.forEach((uploaded, index) => {
          const file = files[index];
          if (!uploaded || !file) return;
          insertUploaded(
            editor,
            {
              url: uploaded.src,
              label: uploaded.alt,
              contentType: file.type || "image/jpeg",
            },
            syncMediaToAllLocales,
            blockIndex,
          );
        });
        return;
      }
      for (const file of files) {
        const uploaded = await onImageUpload(file);
        if (!uploaded) continue;
        insertUploaded(
          editor,
          {
            url: uploaded.src,
            label: uploaded.alt,
            contentType: file.type || "image/jpeg",
          },
          syncMediaToAllLocales,
          blockIndex,
        );
      }
    };
    input.click();
  }, [editor, onImageUpload, onImagesUpload, syncMediaToAllLocales]);

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
      const uploadedList = mediaAttach.onMediaFilesUpload
        ? await mediaAttach.onMediaFilesUpload(files)
        : [];
      if (!mediaAttach.onMediaFilesUpload) {
        for (const file of files) {
          uploadedList.push(await mediaAttach.onMediaFileUpload(file));
        }
      }
      uploadedList.forEach((uploaded, index) => {
        const file = files[index];
        if (!uploaded || !file) return;
        insertUploaded(
          editor,
          {
            url: uploaded.src,
            label: uploaded.label,
            contentType: uploaded.contentType,
          },
          syncMediaToAllLocales,
          blockIndex,
        );
      });
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

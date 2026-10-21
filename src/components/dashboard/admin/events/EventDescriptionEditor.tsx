"use client";

import { Label } from "@/components/atoms/Label";
import { AcademicContentEditor } from "@/components/admin/AcademicContentEditor";
import { performEventMediaFileUpload } from "@/components/dashboard/admin/events/performEventMediaFileUpload";
import { TrackedFileUploadModal } from "@/components/molecules/TrackedFileUploadModal";
import { useTrackedFileUpload } from "@/hooks/useTrackedFileUpload";
import type { BlogEditorMediaAttachConfig } from "@/lib/blog/blogEditorMediaAttach";
import type { MediaSyncToAllLocalesPayload } from "@/lib/learning-content/insertAcademicEditorMedia";
import { validateLearningTaskFile } from "@/lib/learning-tasks/assets";
import { eventMediaPublicUrl } from "@/lib/events/eventMedia";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import type { Dictionary } from "@/types/i18n";

type EditorLabels = Dictionary["admin"]["cms"]["blog"]["editor"];
type AcademicLabels = Dictionary["dashboard"]["adminContents"];

interface EventDescriptionEditorProps {
  descriptionLabel: string;
  editorLabels: EditorLabels;
  academicLabels: AcademicLabels;
  fileUploadProgress: FileUploadProgressLabels;
  eventId?: string;
  descriptionHtml: string;
  onDescriptionHtmlChange: (html: string) => void;
  syncMediaToAllLocales?: (payload: MediaSyncToAllLocalesPayload) => void;
  onError?: (message: string | null) => void;
  disabled?: boolean;
}

export function EventDescriptionEditor({
  descriptionLabel,
  editorLabels,
  academicLabels,
  fileUploadProgress,
  eventId,
  descriptionHtml,
  onDescriptionHtmlChange,
  syncMediaToAllLocales,
  onError,
  disabled,
}: EventDescriptionEditorProps) {
  const { snapshot, isUploading, uploadFiles } = useTrackedFileUpload();

  const mediaUrl = (storagePath: string) =>
    eventMediaPublicUrl(readSupabasePublicEnv().url, storagePath);

  const uploadMediaFiles = async (files: File[]) => {
    return uploadFiles(files, async (file, onProgress) => {
      if (!validateLearningTaskFile(file).ok) {
        onError?.(editorLabels.fileError);
        return null;
      }
      onError?.(null);
      const uploaded = await performEventMediaFileUpload(file, eventId, onProgress);
      if (!uploaded) {
        onError?.(editorLabels.fileError);
        return null;
      }
      return {
        src: mediaUrl(uploaded.storagePath),
        label: file.name.replace(/\.[^.]+$/, ""),
        contentType: file.type,
      };
    });
  };

  const mediaAttach: BlogEditorMediaAttachConfig = {
    labels: editorLabels.attach,
    onMediaFileUpload: async (file) => {
      const [uploaded] = await uploadMediaFiles([file]);
      return uploaded ?? null;
    },
    onMediaFilesUpload: uploadMediaFiles,
  };

  return (
    <div>
      <Label>{descriptionLabel}</Label>
      <AcademicContentEditor
        value={descriptionHtml}
        onChange={onDescriptionHtmlChange}
        onImageUpload={async (file) => {
          const [uploaded] = await uploadMediaFiles([file]);
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
        disabled={disabled || isUploading}
        mediaAttach={mediaAttach}
        syncMediaToAllLocales={syncMediaToAllLocales}
      />
      <TrackedFileUploadModal snapshot={snapshot} labels={fileUploadProgress} />
    </div>
  );
}

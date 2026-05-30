"use client";

import { useState } from "react";
import { Label } from "@/components/atoms/Label";
import { AcademicContentEditor } from "@/components/admin/AcademicContentEditor";
import { performEventMediaFileUpload } from "@/components/dashboard/admin/events/performEventMediaFileUpload";
import { eventMediaPublicUrl } from "@/lib/events/eventMedia";
import type { BlogEditorMediaAttachConfig } from "@/lib/blog/blogEditorMediaAttach";
import type { MediaSyncToAllLocalesPayload } from "@/lib/learning-content/insertAcademicEditorMedia";
import { validateLearningTaskFile } from "@/lib/learning-tasks/assets";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";
import type { Dictionary } from "@/types/i18n";

type EditorLabels = Dictionary["admin"]["cms"]["blog"]["editor"];
type AcademicLabels = Dictionary["dashboard"]["adminContents"];

interface EventDescriptionEditorProps {
  descriptionLabel: string;
  editorLabels: EditorLabels;
  academicLabels: AcademicLabels;
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
  eventId,
  descriptionHtml,
  onDescriptionHtmlChange,
  syncMediaToAllLocales,
  onError,
  disabled,
}: EventDescriptionEditorProps) {
  const [isUploading, setIsUploading] = useState(false);

  const mediaUrl = (storagePath: string) =>
    eventMediaPublicUrl(readSupabasePublicEnv().url, storagePath);

  const uploadMediaFile = async (file: File) => {
    const validation = validateLearningTaskFile(file);
    if (!validation.ok) {
      onError?.(editorLabels.fileError);
      return null;
    }
    setIsUploading(true);
    onError?.(null);
    try {
      const uploaded = await performEventMediaFileUpload(file, eventId);
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
      <Label>{descriptionLabel}</Label>
      <AcademicContentEditor
        value={descriptionHtml}
        onChange={onDescriptionHtmlChange}
        onImageUpload={async (file) => {
          const uploaded = await uploadMediaFile(file);
          if (!uploaded) return null;
          return { src: uploaded.src, alt: uploaded.label };
        }}
        labels={academicLabels}
        disabled={disabled || isUploading}
        mediaAttach={mediaAttach}
        syncMediaToAllLocales={syncMediaToAllLocales}
      />
    </div>
  );
}

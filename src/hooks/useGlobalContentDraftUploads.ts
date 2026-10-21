"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { AdminGlobalDraftMaterial } from "@/components/admin/AdminGlobalContentMaterialsPanel";
import { performGlobalMaterialFileUpload } from "@/components/admin/performGlobalMaterialFileUpload";
import { useTrackedFileUpload } from "@/hooks/useTrackedFileUpload";
import { validateLearningTaskFile } from "@/lib/learning-tasks/assets";

export function useGlobalContentDraftUploads(
  setMaterials: Dispatch<SetStateAction<AdminGlobalDraftMaterial[]>>,
  fileError: string,
  onFileError: (message: string | null) => void,
) {
  const { snapshot, isUploading, uploadFiles } = useTrackedFileUpload();

  const addFiles = useCallback(
    async (files: File[], labelBase: string) => {
      if (files.length === 0) return;
      onFileError(null);
      await uploadFiles(files, async (file, onProgress) => {
        const validation = validateLearningTaskFile(file);
        if (!validation.ok) {
          onFileError(fileError);
          return null;
        }
        const label =
          files.length > 1 && labelBase
            ? `${labelBase} (${file.name})`
            : labelBase || file.name.replace(/\.[^.]+$/, "");
        const uploaded = await performGlobalMaterialFileUpload(file, onProgress);
        if (!uploaded) {
          onFileError(fileError);
          return null;
        }
        setMaterials((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            kind: "file",
            uploadedAssetId: uploaded.assetId,
            storagePath: uploaded.storagePath,
            label,
            filename: file.name,
            contentType: file.type,
            byteSize: file.size,
          },
        ]);
        return uploaded;
      });
    },
    [fileError, onFileError, setMaterials, uploadFiles],
  );

  const uploadInlineImage = useCallback(
    async (file: File) => {
      const validation = validateLearningTaskFile(file);
      if (!validation.ok || !file.type.startsWith("image/")) {
        onFileError(fileError);
        return null;
      }
      onFileError(null);
      const [uploaded] = await uploadFiles([file], (current, onProgress) =>
        performGlobalMaterialFileUpload(current, onProgress),
      );
      if (!uploaded) {
        onFileError(fileError);
        return null;
      }
      const label = file.name.replace(/\.[^.]+$/, "");
      setMaterials((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          kind: "file",
          uploadedAssetId: uploaded.assetId,
          storagePath: uploaded.storagePath,
          label,
          filename: file.name,
          contentType: file.type,
          byteSize: file.size,
        },
      ]);
      return {
        src: `/api/admin/academic/content-assets?path=${encodeURIComponent(uploaded.storagePath)}`,
        alt: label,
      };
    },
    [fileError, onFileError, setMaterials, uploadFiles],
  );

  return { snapshot, isUploading, addFiles, uploadInlineImage };
}

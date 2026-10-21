"use client";

import { useCallback, useState } from "react";
import type {
  TrackedFileUploadProgress,
  TrackedFileUploadSnapshot,
} from "@/lib/client/trackedFileUploadProgress";

export function useTrackedFileUpload() {
  const [snapshot, setSnapshot] = useState<TrackedFileUploadSnapshot | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = useCallback(
    async <T>(
      files: File[],
      uploadOne: (file: File, onProgress: (progress: TrackedFileUploadProgress) => void) => Promise<T | null>,
    ): Promise<Array<T | null>> => {
      if (files.length === 0) return [];
      setIsUploading(true);
      const results: Array<T | null> = [];
      try {
        for (let i = 0; i < files.length; i += 1) {
          const file = files[i];
          setSnapshot({
            filename: file.name,
            current: i + 1,
            total: files.length,
            phase: "preparing",
            percent: 0,
          });
          const uploaded = await uploadOne(file, (progress) => {
            setSnapshot((current) =>
              current ? { ...current, phase: progress.phase, percent: progress.percent } : current,
            );
          });
          results.push(uploaded);
        }
        return results;
      } finally {
        setIsUploading(false);
        setSnapshot(null);
      }
    },
    [],
  );

  return { snapshot, isUploading, uploadFiles };
}

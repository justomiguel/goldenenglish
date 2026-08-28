"use client";

import { useCallback, useState } from "react";
import {
  performBlogMediaFileUpload,
  type BlogMediaUploadProgress,
  type UploadedBlogMediaRef,
} from "@/components/dashboard/admin/cms/blog/performBlogMediaFileUpload";
import { validateLearningTaskFile } from "@/lib/learning-tasks/assets";

export type { BlogMediaUploadProgress };

export type BlogArticleMediaUploadSnapshot = {
  filename: string;
  current: number;
  total: number;
  phase: "preparing" | "uploading";
  percent: number | null;
};

export type BlogMediaUploadFn = (
  file: File,
  articleId: string | undefined,
  onProgress: (progress: BlogMediaUploadProgress) => void,
) => Promise<UploadedBlogMediaRef | null>;

type UseBlogArticleMediaUploadArgs = {
  articleId?: string;
  fileErrorLabel: string;
  onError: (message: string | null) => void;
  uploadFile?: BlogMediaUploadFn;
};

export function useBlogArticleMediaUpload({
  articleId,
  fileErrorLabel,
  onError,
  uploadFile = performBlogMediaFileUpload,
}: UseBlogArticleMediaUploadArgs) {
  const [snapshot, setSnapshot] = useState<BlogArticleMediaUploadSnapshot | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadMany = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return [];
      const results: Array<{ file: File; uploaded: UploadedBlogMediaRef } | null> = [];
      setIsUploading(true);
      onError(null);
      try {
        for (let i = 0; i < files.length; i += 1) {
          const file = files[i];
          if (!validateLearningTaskFile(file).ok) {
            onError(fileErrorLabel);
            results.push(null);
            continue;
          }
          setSnapshot({
            filename: file.name,
            current: i + 1,
            total: files.length,
            phase: "preparing",
            percent: 0,
          });
          const uploaded = await uploadFile(file, articleId, (progress) => {
            setSnapshot((current) =>
              current
                ? { ...current, phase: progress.phase, percent: progress.percent }
                : current,
            );
          });
          if (!uploaded) {
            onError(fileErrorLabel);
            results.push(null);
            break;
          }
          results.push({ file, uploaded });
        }
        return results;
      } finally {
        setIsUploading(false);
        setSnapshot(null);
      }
    },
    [articleId, fileErrorLabel, onError, uploadFile],
  );

  const uploadOne = useCallback(
    async (file: File) => {
      const [first] = await uploadMany([file]);
      return first?.uploaded ?? null;
    },
    [uploadMany],
  );

  return { isUploading, snapshot, uploadOne, uploadMany };
}

"use client";

import {
  readFileAsDataUrlBase64,
  type ReadFileAsDataUrlProgressOptions,
} from "@/lib/client/readFileAsDataUrlBase64";

export type ReadImageFileProgressOptions = ReadFileAsDataUrlProgressOptions;

/** Browser-only; delegates to {@link readFileAsDataUrlBase64}. Name retained for image-heavy call sites. */
export function readImageFileAsBase64(
  file: File,
  options?: ReadImageFileProgressOptions,
): Promise<{ base64: string; mime: string }> {
  return readFileAsDataUrlBase64(file, options);
}

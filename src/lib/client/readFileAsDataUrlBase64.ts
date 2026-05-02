"use client";

export type ReadFileAsDataUrlProgressOptions = {
  /** Called with ratio in [0, 1] while loading; also invoked with `1` once decode completes. */
  onProgress?: (ratio01: number) => void;
};

/** Browser-only: reads a file via FileReader.readAsDataURL; returns raw base64 + MIME from `file.type`. */
export function readFileAsDataUrlBase64(
  file: File,
  options?: ReadFileAsDataUrlProgressOptions,
): Promise<{ base64: string; mime: string }> {
  const onProgress = options?.onProgress;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (!onProgress || !ev.lengthComputable || ev.total <= 0) return;
      onProgress(ev.loaded / ev.total);
    };
    reader.onload = () => {
      const res = reader.result;
      if (typeof res !== "string") {
        reject(new Error("read_failed"));
        return;
      }
      const parts = res.split(",");
      const base64 = parts[1];
      if (!base64) {
        reject(new Error("read_failed"));
        return;
      }
      onProgress?.(1);
      resolve({ base64, mime: file.type });
    };
    reader.onerror = () => reject(reader.error ?? new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

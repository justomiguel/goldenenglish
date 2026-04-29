"use client";

/** Browser-only: reads an image file as raw base64 + MIME (no data URL prefix). */
export function readImageFileAsBase64(
  file: File,
): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
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
      resolve({ base64, mime: file.type });
    };
    reader.onerror = () => reject(reader.error ?? new Error("read_failed"));
    reader.readAsDataURL(file);
  });
}

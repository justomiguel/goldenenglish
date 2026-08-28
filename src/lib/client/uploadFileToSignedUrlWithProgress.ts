export type UploadFileToSignedUrlWithProgressInput = {
  supabaseUrl: string;
  bucket: string;
  storagePath: string;
  token: string;
  file: Blob;
  onProgress?: (percent: number) => void;
};

function signedUploadUrl(input: {
  supabaseUrl: string;
  bucket: string;
  storagePath: string;
  token: string;
}): string {
  const base = input.supabaseUrl.replace(/\/$/, "");
  const path = input.storagePath.replace(/^\/+/, "").replace(/\/+/g, "/");
  const url = new URL(`${base}/storage/v1/object/upload/sign/${input.bucket}/${path}`);
  url.searchParams.set("token", input.token);
  return url.toString();
}

function progressPercent(ev: ProgressEvent<EventTarget>): number | null {
  if (!ev.lengthComputable || !ev.total) return null;
  return Math.min(100, Math.max(0, Math.round((ev.loaded / ev.total) * 100)));
}

/** PUT a file to a Supabase signed upload URL with byte-level progress. */
export function uploadFileToSignedUrlWithProgress(
  input: UploadFileToSignedUrlWithProgressInput,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUploadUrl(input));
    xhr.setRequestHeader("x-upsert", "false");

    let sawDeterminate = false;
    input.onProgress?.(0);
    xhr.upload.onprogress = (ev) => {
      const percent = progressPercent(ev);
      if (percent === null) return;
      sawDeterminate = true;
      input.onProgress?.(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (!sawDeterminate) input.onProgress?.(100);
        resolve();
        return;
      }
      reject(new Error(`signed_upload_http_${xhr.status}`));
    };

    xhr.onerror = () => {
      reject(new Error("signed_upload_network"));
    };

    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", input.file);
    xhr.send(body);
  });
}

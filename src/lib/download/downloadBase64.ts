/**
 * Saves a base64 artifact produced by a server action as a browser download.
 * Server actions cannot stream a file back, so they return base64 and the
 * client turns it into a Blob here.
 */
export function downloadBase64(base64: string, mime: string, filename: string) {
  const byteString = atob(base64);
  const len = byteString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) bytes[i] = byteString.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Whether a browser `File` is a ZIP favicon bundle (favicon.io style). */
export function faviconFileIsZip(file: File): boolean {
  const lower = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  return (
    lower.endsWith(".zip") ||
    mime === "application/zip" ||
    mime === "application/x-zip-compressed"
  );
}

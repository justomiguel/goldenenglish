function safeSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}

function extFromMime(mime: string): string {
  const normalized = mime.toLowerCase().trim();
  if (normalized === "application/pdf") return "pdf";
  if (normalized === "image/jpeg") return "jpg";
  if (normalized === "image/png") return "png";
  if (normalized === "image/webp") return "webp";
  if (normalized === "video/mp4") return "mp4";
  if (normalized.includes("/")) return safeSegment(normalized.split("/")[1] ?? "bin");
  return "bin";
}

export function buildEventAttendeeUploadPath(args: {
  eventId: string;
  attendeeId: string;
  fieldId: string;
  filename: string;
  mime: string;
  now?: number;
}): string {
  const ext = extFromMime(args.mime);
  const base = safeSegment(args.filename.replace(/\.[^.]+$/, ""));
  const stamp = (args.now ?? Date.now()).toString(36);
  return `${args.eventId}/${args.attendeeId}/${args.fieldId}/${base}-${stamp}.${ext}`;
}

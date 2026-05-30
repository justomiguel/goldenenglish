import type { AttachmentDisplayKind } from "@/lib/learning-tasks/attachmentDisplayKind";

const EXTENSION_BADGE: Record<string, string> = {
  doc: "DOC",
  docx: "DOC",
  xls: "XLS",
  xlsx: "XLS",
  ppt: "PPT",
  pptx: "PPT",
  jpeg: "JPG",
  jpg: "JPG",
};

const KIND_BADGE: Record<AttachmentDisplayKind, string> = {
  embed: "WEB",
  pdf: "PDF",
  word: "DOC",
  spreadsheet: "XLS",
  presentation: "PPT",
  office: "DOC",
  image: "IMG",
  audio: "AUD",
  video: "VID",
  other: "FILE",
};

/** Short uppercase badge for file-type chips (PDF, DOC, …). */
export function formatAttachmentTypeBadgeLabel(
  kind: AttachmentDisplayKind,
  extension: string | null,
): string {
  if (extension) {
    const normalized = extension.toLowerCase();
    return EXTENSION_BADGE[normalized] ?? normalized.toUpperCase();
  }
  return KIND_BADGE[kind];
}

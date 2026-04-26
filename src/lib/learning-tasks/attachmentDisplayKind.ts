export type AttachmentDisplayKind =
  | "embed"
  | "pdf"
  | "word"
  | "spreadsheet"
  | "presentation"
  | "office"
  | "image"
  | "audio"
  | "video"
  | "other";

const OFFICE_EXT = [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];

const OFFICE_MIMES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

/**
 * PDF / Word / Excel / PowerPoint / genérico Office por MIME o extensión.
 * `null` si no corresponde a documento de esa familia.
 */
export function classifyDocumentAttachmentKind(
  mime: string | null | undefined,
  filename?: string | null,
): "pdf" | "word" | "spreadsheet" | "presentation" | "office" | null {
  const m = (mime ?? "").toLowerCase().trim();
  const n = (filename ?? "").toLowerCase();

  if (m === "application/pdf" || n.endsWith(".pdf")) return "pdf";
  if (
    m === "application/msword"
    || m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    || n.endsWith(".doc")
    || n.endsWith(".docx")
  ) {
    return "word";
  }
  if (
    m === "application/vnd.ms-excel"
    || m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    || n.endsWith(".xls")
    || n.endsWith(".xlsx")
  ) {
    return "spreadsheet";
  }
  if (
    m === "application/vnd.ms-powerpoint"
    || m === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    || n.endsWith(".ppt")
    || n.endsWith(".pptx")
  ) {
    return "presentation";
  }
  if (OFFICE_MIMES.has(m) || OFFICE_EXT.some((ext) => n.endsWith(ext))) return "office";
  return null;
}

/** Stable order for grouped attachment sections in admin UI */
export const ATTACHMENT_DISPLAY_SECTION_ORDER: AttachmentDisplayKind[] = [
  "embed",
  "pdf",
  "word",
  "spreadsheet",
  "presentation",
  "office",
  "image",
  "video",
  "audio",
  "other",
];

export function classifyAttachmentDisplayKind(input: {
  kind: "file" | "embed";
  mimeType?: string | null;
  filename?: string | null;
  /** When no filename, e.g. use asset label for extension sniffing */
  label?: string | null;
}): AttachmentDisplayKind {
  if (input.kind === "embed") return "embed";
  const mime = (input.mimeType ?? "").toLowerCase().trim();
  const name = (input.filename ?? input.label ?? "").toLowerCase();

  const doc = classifyDocumentAttachmentKind(mime || null, name || null);
  if (doc) return doc;

  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";

  return "other";
}

/** Tailwind utility fragments for list rows / section accents (design tokens only). */
export const ATTACHMENT_KIND_ACCENT: Record<
  AttachmentDisplayKind,
  { sectionBar: string; rowBar: string; iconWrap: string }
> = {
  embed: {
    sectionBar: "border-l-[var(--color-primary)]",
    rowBar: "border-l-[var(--color-primary)]",
    iconWrap: "bg-[var(--color-muted)] text-[var(--color-primary)]",
  },
  pdf: {
    sectionBar: "border-l-[var(--color-secondary)]",
    rowBar: "border-l-[var(--color-secondary)]",
    iconWrap: "bg-[var(--color-muted)] text-[var(--color-secondary)]",
  },
  word: {
    sectionBar: "border-l-[var(--color-primary)]",
    rowBar: "border-l-[var(--color-primary)]",
    iconWrap: "bg-[var(--color-muted)] text-[var(--color-primary)]",
  },
  spreadsheet: {
    sectionBar: "border-l-[var(--color-success)]",
    rowBar: "border-l-[var(--color-success)]",
    iconWrap: "bg-[var(--color-muted)] text-[var(--color-success)]",
  },
  presentation: {
    sectionBar: "border-l-[var(--color-warning)]",
    rowBar: "border-l-[var(--color-warning)]",
    iconWrap: "bg-[var(--color-muted)] text-[var(--color-warning)]",
  },
  office: {
    sectionBar: "border-l-[var(--color-warning)]",
    rowBar: "border-l-[var(--color-warning)]",
    iconWrap: "bg-[var(--color-muted)] text-[var(--color-warning)]",
  },
  image: {
    sectionBar: "border-l-[var(--color-accent)]",
    rowBar: "border-l-[var(--color-accent)]",
    iconWrap: "bg-[var(--color-muted)] text-[var(--color-accent)]",
  },
  audio: {
    sectionBar: "border-l-[var(--color-primary)]",
    rowBar: "border-l-[var(--color-primary)]",
    iconWrap: "bg-[var(--color-muted)] text-[var(--color-primary)]",
  },
  video: {
    sectionBar: "border-l-[var(--color-primary)]",
    rowBar: "border-l-[var(--color-primary)]",
    iconWrap: "bg-[var(--color-muted)] text-[var(--color-primary)]",
  },
  other: {
    sectionBar: "border-l-[var(--color-border)]",
    rowBar: "border-l-[var(--color-border)]",
    iconWrap: "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
  },
};

export function groupItemsByAttachmentDisplayKind<T>(
  items: T[],
  classify: (item: T) => AttachmentDisplayKind,
): { kind: AttachmentDisplayKind; items: T[] }[] {
  const buckets = new Map<AttachmentDisplayKind, T[]>();
  for (const k of ATTACHMENT_DISPLAY_SECTION_ORDER) {
    buckets.set(k, []);
  }
  for (const item of items) {
    const k = classify(item);
    const list = buckets.get(k);
    if (list) list.push(item);
    else buckets.get("other")!.push(item);
  }
  return ATTACHMENT_DISPLAY_SECTION_ORDER.map((kind) => ({
    kind,
    items: buckets.get(kind) ?? [],
  })).filter((g) => g.items.length > 0);
}

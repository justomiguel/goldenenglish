import { normalizeVideoEmbedUrl } from "@/lib/learning-tasks/assets";
import { sanitizeMessageHtml } from "@/lib/messaging/sanitizeMessageHtml";

export type LessonMaterialSourceBlock = {
  id: string;
  kind: string;
  sortOrder: number;
  payload: Record<string, unknown>;
  storagePath?: string | null;
  mimeType?: string | null;
  label?: string | null;
};

export type LessonMaterialView =
  | { id: string; kind: "html"; html: string }
  | { id: string; kind: "video"; label: string; embedUrl: string }
  | { id: string; kind: "file"; label: string; storagePath: string; mimeType: string }
  | { id: string; kind: "link"; label: string; href: string }
  | { id: string; kind: "quiz"; prompt: string; href: string | null };

function textOf(payload: Record<string, unknown>, key: string): string {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

function httpHref(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function buildLessonMaterials(input: {
  locked: boolean;
  bodyHtml?: string | null;
  blocks: readonly LessonMaterialSourceBlock[];
}): LessonMaterialView[] {
  if (input.locked) return [];
  const sorted = [...input.blocks].sort((a, b) => a.sortOrder - b.sortOrder);
  if (sorted.length === 0) {
    const html = sanitizeMessageHtml(input.bodyHtml ?? "");
    return html.trim() ? [{ id: "body", kind: "html", html }] : [];
  }

  const items: LessonMaterialView[] = [];
  for (const block of sorted) {
    const label = block.label?.trim() || textOf(block.payload, "label") || "Material";
    if (block.kind === "text") {
      const html = sanitizeMessageHtml(textOf(block.payload, "bodyHtml"));
      if (html.trim()) items.push({ id: block.id, kind: "html", html });
      continue;
    }
    if (block.kind === "video_embed") {
      const normalized = normalizeVideoEmbedUrl(textOf(block.payload, "embedUrl"));
      if (normalized.ok) {
        items.push({ id: block.id, kind: "video", label, embedUrl: normalized.embedUrl });
      }
      continue;
    }
    if (block.kind === "file" || block.kind === "pdf" || block.kind === "audio" || block.kind === "image") {
      if (block.storagePath) {
        items.push({
          id: block.id,
          kind: "file",
          label,
          storagePath: block.storagePath,
          mimeType: block.mimeType || "application/octet-stream",
        });
      }
      continue;
    }
    if (block.kind === "external_link") {
      const href = httpHref(textOf(block.payload, "href") || textOf(block.payload, "url"));
      if (href) items.push({ id: block.id, kind: "link", label, href });
      continue;
    }
    if (block.kind === "quiz") {
      const prompt = textOf(block.payload, "prompt") || textOf(block.payload, "bodyHtml") || label;
      items.push({ id: block.id, kind: "quiz", prompt, href: httpHref(textOf(block.payload, "href")) });
    }
  }
  return items;
}

export async function withSignedLessonFiles(
  items: readonly LessonMaterialView[],
  sign: (storagePath: string) => Promise<string | null>,
): Promise<Array<Exclude<LessonMaterialView, { kind: "file" }> | { id: string; kind: "file"; label: string; href: string; mimeType: string }>> {
  const signed: Array<
    | Exclude<LessonMaterialView, { kind: "file" }>
    | { id: string; kind: "file"; label: string; href: string; mimeType: string }
  > = [];
  for (const item of items) {
    if (item.kind !== "file") {
      signed.push(item);
      continue;
    }
    const href = await sign(item.storagePath);
    if (!href) continue;
    signed.push({ id: item.id, kind: "file", label: item.label, href, mimeType: item.mimeType });
  }
  return signed;
}

export type SignedLessonMaterial = Awaited<ReturnType<typeof withSignedLessonFiles>>[number];

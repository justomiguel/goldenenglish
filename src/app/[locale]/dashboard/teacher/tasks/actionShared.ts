import { z } from "zod";

export type LearningTaskActionCode =
  | "unauthorized"
  | "forbidden"
  | "invalid_input"
  | "empty_body"
  | "embed_url_invalid"
  | "file_too_large"
  | "mime_invalid"
  | "not_found"
  | "persist_failed";

export type LearningTaskActionResult =
  | { ok: true; id: string }
  | { ok: false; code: LearningTaskActionCode };

export const TemplateSchema = z.object({
  locale: z.string().min(2).max(8),
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(180),
  bodyHtml: z.string().trim().min(1).max(80_000),
});

export const EmbedSchema = z.object({
  templateId: z.string().uuid(),
  label: z.string().trim().min(1).max(180),
  url: z.string().trim().min(1).max(1000),
});

export const UploadSchema = z.object({
  templateId: z.string().uuid(),
  label: z.string().trim().min(1).max(180),
  filename: z.string().trim().min(1).max(240),
  contentType: z.string().trim().min(1).max(120),
  fileBase64: z.string().min(1),
});

export const AssignSchema = z.object({
  locale: z.string().min(2).max(8),
  templateId: z.string().uuid(),
  sectionId: z.string().uuid(),
  startAt: z.string().datetime({ offset: true }),
  dueAt: z.string().datetime({ offset: true }),
  title: z.string().trim().min(1).max(180).optional(),
});

export function decodeBase64(payload: string): Uint8Array | null {
  try {
    const buf = Buffer.from(payload, "base64");
    return buf.length > 0 ? new Uint8Array(buf) : null;
  } catch {
    return null;
  }
}

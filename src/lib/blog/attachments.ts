import { z } from "zod";

export const blogAttachmentSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("embed"),
    label: z.string().trim().min(1).max(180),
    url: z.string().trim().url(),
    sortOrder: z.number().int().min(0).max(200),
  }),
  z.object({
    kind: z.literal("file"),
    label: z.string().trim().min(1).max(180),
    storagePath: z.string().trim().min(1).max(500),
    filename: z.string().trim().min(1).max(240).optional(),
    contentType: z.string().trim().min(1).max(120).optional(),
    byteSize: z.number().int().min(1).max(50 * 1024 * 1024).optional(),
    sortOrder: z.number().int().min(0).max(200),
  }),
]);

export type BlogAttachment = z.infer<typeof blogAttachmentSchema>;

export const blogAttachmentsSchema = z.array(blogAttachmentSchema).max(60);

export function parseBlogAttachmentsFromDb(value: unknown): BlogAttachment[] {
  const parsed = blogAttachmentsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

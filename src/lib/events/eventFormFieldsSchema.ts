import { z } from "zod";
import type { EventFieldPayloadEntry, EventFormFieldDefinition } from "@/lib/events/types";

const entrySchema = z.object({
  fieldId: z.string().uuid(),
  valueText: z.string().trim().max(5000).optional(),
  valueNumber: z.number().finite().optional(),
  valueDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  fileStoragePath: z.string().trim().min(1).max(500).optional(),
  fileSizeBytes: z.number().int().positive().optional(),
  fileMimeType: z.string().trim().max(120).optional(),
});

function hasValue(entry: EventFieldPayloadEntry): boolean {
  return Boolean(
    entry.valueText ||
      typeof entry.valueNumber === "number" ||
      entry.valueDate ||
      entry.fileStoragePath,
  );
}

export function buildEventFieldValuesSchema(fields: EventFormFieldDefinition[]) {
  const fieldsById = new Map(fields.map((field) => [field.id, field]));

  return z.array(entrySchema).superRefine((entries, ctx) => {
    const entriesById = new Map(entries.map((entry) => [entry.fieldId, entry]));

    for (const entry of entries) {
      const field = fieldsById.get(entry.fieldId);
      if (!field) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [],
          message: `unknown_field:${entry.fieldId}`,
        });
        continue;
      }

      if ((field.fieldType === "file" || field.fieldType === "image") && entry.fileStoragePath) {
        const maxSize = field.maxFileSizeBytes ?? 26214400;
        if ((entry.fileSizeBytes ?? 0) > maxSize) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [],
            message: `file_too_large:${entry.fieldId}`,
          });
        }

        const allowed = field.allowedMimeTypes ?? [];
        if (
          allowed.length > 0 &&
          entry.fileMimeType &&
          !allowed.includes(entry.fileMimeType.toLowerCase())
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [],
            message: `file_mime_not_allowed:${entry.fieldId}`,
          });
        }
      }
    }

    for (const field of fields) {
      if (!field.required) continue;
      const existing = entriesById.get(field.id);
      if (!existing || !hasValue(existing)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [],
          message: `required_field_missing:${field.id}`,
        });
      }
    }
  });
}

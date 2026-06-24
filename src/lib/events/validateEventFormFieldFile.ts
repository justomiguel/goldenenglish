import type { EventFormFieldDefinition } from "@/lib/events/types";

export const EVENT_FORM_FIELD_DEFAULT_MAX_BYTES = 26_214_400;

export const EVENT_FORM_IMAGE_DEFAULT_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const EVENT_FORM_FILE_DEFAULT_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type ValidateEventFormFieldFileResult =
  | { ok: true; mime: string }
  | { ok: false; code: "missing" | "too_large" | "invalid_type" };

export function resolveEventFormFieldMaxBytes(field: EventFormFieldDefinition): number {
  return field.maxFileSizeBytes ?? EVENT_FORM_FIELD_DEFAULT_MAX_BYTES;
}

export function resolveEventFormFieldAllowedMimeTypes(
  field: EventFormFieldDefinition,
): readonly string[] {
  if (field.allowedMimeTypes && field.allowedMimeTypes.length > 0) {
    return field.allowedMimeTypes.map((item) => item.toLowerCase());
  }
  if (field.fieldType === "image") {
    return EVENT_FORM_IMAGE_DEFAULT_MIMES;
  }
  return EVENT_FORM_FILE_DEFAULT_MIMES;
}

export function resolveEventFormFieldAcceptAttr(field: EventFormFieldDefinition): string {
  return resolveEventFormFieldAllowedMimeTypes(field).join(",");
}

export function eventFormFieldMaxSizeMb(field: EventFormFieldDefinition): number {
  return Math.floor(resolveEventFormFieldMaxBytes(field) / (1024 * 1024));
}

export function fillEventFormFieldMaxMbTemplate(
  template: string,
  field: EventFormFieldDefinition,
): string {
  return template.replaceAll("{max}", String(eventFormFieldMaxSizeMb(field)));
}

export function isAllowedEventFormFieldMime(
  field: EventFormFieldDefinition,
  mime: string,
): boolean {
  const normalized = mime.trim().toLowerCase() || "application/octet-stream";
  const allowed = resolveEventFormFieldAllowedMimeTypes(field);
  return allowed.includes(normalized);
}

export function validateEventFormFieldFile(
  field: EventFormFieldDefinition,
  file: Pick<File, "size" | "type"> | null | undefined,
): ValidateEventFormFieldFileResult {
  if (!file || file.size <= 0) {
    return { ok: false, code: "missing" };
  }
  if (file.size > resolveEventFormFieldMaxBytes(field)) {
    return { ok: false, code: "too_large" };
  }
  const mime = file.type?.trim() || "application/octet-stream";
  if (!isAllowedEventFormFieldMime(field, mime)) {
    return { ok: false, code: "invalid_type" };
  }
  return { ok: true, mime };
}

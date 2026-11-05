import { uploadEventRegistrationFile } from "@/lib/client/uploadEventRegistrationFile";
import type { EventFieldPayloadEntry, EventFormFieldDefinition } from "@/lib/events/types";

function isFileField(fieldType: EventFormFieldDefinition["fieldType"]): boolean {
  return fieldType === "file" || fieldType === "image";
}

export async function collectEventRegisterUploads(input: {
  slug: string;
  locale: string;
  email: string;
  dniOrPassport: string;
  fields: EventFormFieldDefinition[];
  fieldValues: Record<string, string>;
  fieldFiles: Record<string, File | null>;
  receiptFile: File | null;
  requiresReceipt: boolean;
  onProgress: (percent: number) => void;
  onField: (fieldId: string | null) => void;
}): Promise<
  | { ok: true; fieldValues: EventFieldPayloadEntry[]; receiptPath: string | null }
  | { ok: false; code: "field_upload_failed" | "receipt_upload_failed" }
> {
  const textValues = input.fields
    .filter((field) => !isFileField(field.fieldType))
    .map((field) => ({ fieldId: field.id, valueText: input.fieldValues[field.id] ?? "" }))
    .filter((entry) => Boolean(entry.valueText.trim()));

  const fileValues: EventFieldPayloadEntry[] = [];
  for (const field of input.fields.filter((item) => isFileField(item.fieldType))) {
    const file = input.fieldFiles[field.id];
    if (!file) continue;
    input.onField(field.id);
    const uploaded = await uploadEventRegistrationFile({
      slug: input.slug,
      locale: input.locale,
      email: input.email,
      dniOrPassport: input.dniOrPassport,
      file,
      kind: "field",
      fieldId: field.id,
      onProgress: input.onProgress,
    });
    input.onField(null);
    if (!uploaded.ok) return { ok: false, code: "field_upload_failed" };
    fileValues.push({
      fieldId: field.id,
      fileStoragePath: uploaded.path,
      fileSizeBytes: file.size,
      fileMimeType: file.type,
    });
  }

  if (!input.requiresReceipt || !input.receiptFile) {
    return { ok: true, fieldValues: [...textValues, ...fileValues], receiptPath: null };
  }

  input.onProgress(0);
  const receipt = await uploadEventRegistrationFile({
    slug: input.slug,
    locale: input.locale,
    email: input.email,
    dniOrPassport: input.dniOrPassport,
    file: input.receiptFile,
    kind: "receipt",
    onProgress: input.onProgress,
  });
  if (!receipt.ok) return { ok: false, code: "receipt_upload_failed" };

  return {
    ok: true,
    fieldValues: [...textValues, ...fileValues],
    receiptPath: receipt.path,
  };
}

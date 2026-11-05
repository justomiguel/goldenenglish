export const CONTACT_MESSAGE_EXPORT_FIELD_ORDER = [
  "sentAt",
  "name",
  "email",
  "phone",
  "subject",
  "body",
] as const;

export type ContactMessageExportField = (typeof CONTACT_MESSAGE_EXPORT_FIELD_ORDER)[number];

export type ContactMessageExportScope = "all" | "latest_2000";

export const CONTACT_MESSAGE_EXPORT_PAGE_SIZE = 200;

export const CONTACT_MESSAGE_EXPORT_LATEST_LIMIT = 2000;

export function orderContactMessageExportFields(
  fields: readonly ContactMessageExportField[],
): ContactMessageExportField[] {
  const selected = new Set(fields);
  return CONTACT_MESSAGE_EXPORT_FIELD_ORDER.filter((field) => selected.has(field));
}

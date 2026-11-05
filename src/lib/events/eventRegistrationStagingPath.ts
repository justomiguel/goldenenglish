import {
  buildEventFormFieldStagingKey,
  buildEventFormFieldStagingPath,
} from "@/lib/events/buildEventFormFieldStagingPath";

const RECEIPT_SEGMENT = "receipt";

export function buildEventReceiptStagingPath(args: {
  eventId: string;
  email: string;
  dniOrPassport: string;
  slug: string;
  filename: string;
  mime: string;
  now?: number;
}): string {
  return buildEventFormFieldStagingPath({
    eventId: args.eventId,
    stagingKey: buildEventFormFieldStagingKey({
      email: args.email,
      dniOrPassport: args.dniOrPassport,
      slug: args.slug,
    }),
    fieldId: RECEIPT_SEGMENT,
    filename: args.filename,
    mime: args.mime,
    now: args.now,
  });
}

export function eventStagingFileMeta(path: string): { fileName: string; mime: string } {
  const fileName = path.slice(path.lastIndexOf("/") + 1) || "receipt";
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const mime =
    ext === "pdf"
      ? "application/pdf"
      : ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : "image/jpeg";
  return { fileName, mime };
}

export function isEventRegistrationStagingPath(
  path: string,
  input: { eventId: string; stagingKey: string; segment: string },
): boolean {
  const normalized = path.trim().replace(/^\/+/, "");
  if (!normalized || normalized.includes("..") || normalized.includes("//")) return false;
  const segment = input.segment.trim();
  if (!segment || segment.includes("/")) return false;
  const prefix = `${input.eventId}/staging/${input.stagingKey}/${segment}/`;
  return normalized.startsWith(prefix) && normalized.length > prefix.length;
}

export type EventRegistrationStagingGate =
  | { ok: true }
  | { ok: false; code: "receipt_required" | "receipt_path_mismatch" | "file_path_mismatch" };

export function assertEventRegistrationStaging(input: {
  eventId: string;
  slug: string;
  email: string;
  dniOrPassport: string;
  requireReceipt: boolean;
  receiptPath: string;
  filePaths: Array<{ fieldId: string; path: string }>;
}): EventRegistrationStagingGate {
  const stagingKey = buildEventFormFieldStagingKey({
    email: input.email,
    dniOrPassport: input.dniOrPassport,
    slug: input.slug,
  });
  const owned = (path: string, segment: string) =>
    isEventRegistrationStagingPath(path, {
      eventId: input.eventId,
      stagingKey,
      segment,
    });

  if (input.requireReceipt && !owned(input.receiptPath, RECEIPT_SEGMENT)) {
    return {
      ok: false,
      code: input.receiptPath.trim() ? "receipt_path_mismatch" : "receipt_required",
    };
  }

  for (const file of input.filePaths) {
    if (!owned(file.path, file.fieldId)) return { ok: false, code: "file_path_mismatch" };
  }

  return { ok: true };
}

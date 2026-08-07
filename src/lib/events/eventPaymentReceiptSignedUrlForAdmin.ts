import "server-only";
import { createEventUploadReadSignedUrl } from "@/lib/events/createEventUploadReadSignedUrl";

/** @deprecated Prefer createEventUploadReadSignedUrl — kept as a thin alias for payment callers. */
export async function eventPaymentReceiptSignedUrlForAdmin(
  objectPath: string | null | undefined,
): Promise<string | null> {
  return createEventUploadReadSignedUrl(objectPath);
}

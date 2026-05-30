import { inferAttachmentFileExtension } from "@/lib/rich-content/inferAttachmentFileExtension";

export function isPdfRichContentFile(href: string, label: string): boolean {
  return inferAttachmentFileExtension(href, label) === "pdf";
}

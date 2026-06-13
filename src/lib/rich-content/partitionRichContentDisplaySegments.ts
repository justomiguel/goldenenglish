import { classifyAttachmentDisplayKind } from "@/lib/learning-tasks/attachmentDisplayKind";
import { inferAttachmentFileExtension } from "@/lib/rich-content/inferAttachmentFileExtension";
import type {
  RichContentDisplaySegment,
  RichContentHtmlSegment,
} from "@/lib/rich-content/richContentDisplayTypes";

export type RichContentMediaSegment = Exclude<RichContentDisplaySegment, RichContentHtmlSegment>;

export function isRichContentNonImageAttachmentSegment(
  segment: RichContentMediaSegment,
): boolean {
  if (segment.kind === "embed") return false;
  if (segment.kind === "audio" || segment.kind === "video") return true;
  if (segment.kind === "file") {
    const extension = inferAttachmentFileExtension(segment.href, segment.label);
    const displayKind = classifyAttachmentDisplayKind({
      kind: "file",
      label: segment.label,
      extension,
    });
    return displayKind !== "image";
  }
  return false;
}

/** Moves non-image attachments (and audio/video) to a trailing list; keeps prose, embeds, and image files in body order. */
export function partitionRichContentDisplaySegments(segments: RichContentDisplaySegment[]): {
  body: RichContentDisplaySegment[];
  attachments: RichContentMediaSegment[];
} {
  const body: RichContentDisplaySegment[] = [];
  const attachments: RichContentMediaSegment[] = [];

  for (const segment of segments) {
    if (segment.kind === "html") {
      body.push(segment);
      continue;
    }
    if (isRichContentNonImageAttachmentSegment(segment)) {
      attachments.push(segment);
    } else {
      body.push(segment);
    }
  }

  return { body, attachments };
}

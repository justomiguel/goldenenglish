import { sanitizeBlogHtml } from "@/lib/blog/sanitizeBlogHtml";
import { parseRichEditorHtmlForDisplay } from "@/lib/rich-content/parseRichEditorHtmlForDisplay";
import { partitionRichContentDisplaySegments } from "@/lib/rich-content/partitionRichContentDisplaySegments";
import type {
  RichContentDisplayLabels,
  RichContentDisplaySegment,
} from "@/lib/rich-content/richContentDisplayTypes";
import { RichContentMediaBlock } from "@/components/molecules/RichContentMediaBlock";

const PROSE_CLASS =
  "prose prose-neutral max-w-none text-[var(--color-foreground)] [&_p]:text-justify [&_a]:text-[var(--color-primary)] [&_a]:underline [&_iframe]:hidden [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-[var(--layout-border-radius)]";

interface RichContentDisplayProps {
  html: string;
  labels: RichContentDisplayLabels;
  className?: string;
  proseClassName?: string;
  indentFirstProseBlock?: boolean;
  /** Event pages: PDF/Office/audio/video blocks render under `attachmentsSectionTitle`. */
  groupNonImageAttachments?: boolean;
}

function htmlOrdinalAtIndex(segments: RichContentDisplaySegment[]): number[] {
  const ordinals: number[] = [];
  let htmlCount = 0;
  for (let i = 0; i < segments.length; i += 1) {
    if (segments[i].kind === "html") {
      ordinals[i] = htmlCount;
      htmlCount += 1;
    } else {
      ordinals[i] = -1;
    }
  }
  return ordinals;
}

function RichContentSegmentList({
  segments,
  labels,
  proseClasses,
  indentFirstProseBlock,
  keyPrefix,
}: {
  segments: RichContentDisplaySegment[];
  labels: RichContentDisplayLabels;
  proseClasses: string;
  indentFirstProseBlock: boolean;
  keyPrefix: string;
}) {
  const ordinals = htmlOrdinalAtIndex(segments);

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === "html") {
          const isFirstProse = ordinals[index] === 0;
          return (
            <div
              key={`${keyPrefix}-html-${index}`}
              className={`${proseClasses}${indentFirstProseBlock && isFirstProse ? " [&_p:first-of-type]:indent-8" : ""}`}
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          );
        }
        return (
          <RichContentMediaBlock
            key={`${keyPrefix}-media-${index}`}
            segment={segment}
            labels={labels}
          />
        );
      })}
    </>
  );
}

export function RichContentDisplay({
  html,
  labels,
  className,
  proseClassName,
  indentFirstProseBlock = false,
  groupNonImageAttachments = false,
}: RichContentDisplayProps) {
  const parsed = parseRichEditorHtmlForDisplay(sanitizeBlogHtml(html));
  if (parsed.length === 0) return null;

  const proseClasses = proseClassName ?? PROSE_CLASS;
  const useAttachmentSection =
    groupNonImageAttachments && Boolean(labels.attachmentsSectionTitle?.trim());
  const { body, attachments } = useAttachmentSection
    ? partitionRichContentDisplaySegments(parsed)
    : { body: parsed, attachments: [] };

  return (
    <div className={className ?? "space-y-4"}>
      <RichContentSegmentList
        segments={body}
        labels={labels}
        proseClasses={proseClasses}
        indentFirstProseBlock={indentFirstProseBlock}
        keyPrefix="body"
      />
      {attachments.length > 0 && labels.attachmentsSectionTitle ? (
        <section
          className="space-y-4 border-t border-[var(--color-border)] pt-8"
          aria-label={labels.attachmentsSectionTitle}
        >
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {labels.attachmentsSectionTitle}
          </h2>
          <div className="space-y-4">
            {attachments.map((segment, index) => (
              <RichContentMediaBlock
                key={`attachment-${index}`}
                segment={segment}
                labels={labels}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

import { sanitizeBlogHtml } from "@/lib/blog/sanitizeBlogHtml";
import { parseRichEditorHtmlForDisplay } from "@/lib/rich-content/parseRichEditorHtmlForDisplay";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";
import { RichContentMediaBlock } from "@/components/molecules/RichContentMediaBlock";

const PROSE_CLASS =
  "prose prose-neutral max-w-none text-[var(--color-foreground)] [&_p]:text-justify [&_a]:text-[var(--color-primary)] [&_a]:underline [&_iframe]:hidden [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-[var(--layout-border-radius)]";

interface RichContentDisplayProps {
  html: string;
  labels: RichContentDisplayLabels;
  className?: string;
  proseClassName?: string;
  indentFirstProseBlock?: boolean;
}

export function RichContentDisplay({
  html,
  labels,
  className,
  proseClassName,
  indentFirstProseBlock = false,
}: RichContentDisplayProps) {
  const segments = parseRichEditorHtmlForDisplay(sanitizeBlogHtml(html));
  if (segments.length === 0) return null;

  const proseClasses = proseClassName ?? PROSE_CLASS;
  const htmlOrdinalAtIndex: number[] = [];
  {
    let htmlCount = 0;
    for (let i = 0; i < segments.length; i += 1) {
      if (segments[i].kind === "html") {
        htmlOrdinalAtIndex[i] = htmlCount;
        htmlCount += 1;
      } else {
        htmlOrdinalAtIndex[i] = -1;
      }
    }
  }

  return (
    <div className={className ?? "space-y-4"}>
      {segments.map((segment, index) => {
        if (segment.kind === "html") {
          const isFirstProse = htmlOrdinalAtIndex[index] === 0;
          return (
            <div
              key={`html-${index}`}
              className={`${proseClasses}${indentFirstProseBlock && isFirstProse ? " [&_p:first-of-type]:indent-8" : ""}`}
              dangerouslySetInnerHTML={{ __html: segment.html }}
            />
          );
        }
        return (
          <RichContentMediaBlock key={`media-${index}`} segment={segment} labels={labels} />
        );
      })}
    </div>
  );
}

import { RichContentDisplay } from "@/components/organisms/RichContentDisplay";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";

const EVENT_DESCRIPTION_PROSE =
  "prose prose-neutral max-w-none text-[var(--color-foreground)] [&_p]:text-justify [&_p]:leading-relaxed [&_p+p]:mt-4 [&_a]:text-[var(--color-primary)] [&_a]:underline [&_iframe]:hidden [&_img]:mt-8 [&_img]:mb-8 [&_img]:max-w-full [&_img]:rounded-[var(--layout-border-radius)]";

interface EventDescriptionHtmlProps {
  html: string;
  labels: RichContentDisplayLabels;
  className?: string;
}

export function EventDescriptionHtml({ html, labels, className }: EventDescriptionHtmlProps) {
  return (
    <RichContentDisplay
      html={html}
      labels={labels}
      className={className ?? "space-y-8"}
      proseClassName={EVENT_DESCRIPTION_PROSE}
      indentFirstProseBlock
    />
  );
}

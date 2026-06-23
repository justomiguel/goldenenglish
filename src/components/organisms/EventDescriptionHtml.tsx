import { RichContentDisplay } from "@/components/organisms/RichContentDisplay";
import type { RichContentDisplayLabels } from "@/lib/rich-content/richContentDisplayTypes";
import { publicEventDescriptionProseClass } from "@/lib/events/publicEventSurfaceClasses";
import type { PublicEventSurfaceVariant } from "@/lib/events/publicEventSurfaceVariant";

interface EventDescriptionHtmlProps {
  html: string;
  labels: RichContentDisplayLabels;
  className?: string;
  surfaceVariant?: PublicEventSurfaceVariant;
}

export function EventDescriptionHtml({
  html,
  labels,
  className,
  surfaceVariant = "default",
}: EventDescriptionHtmlProps) {
  return (
    <RichContentDisplay
      html={html}
      labels={labels}
      className={className ?? "space-y-8"}
      proseClassName={publicEventDescriptionProseClass(surfaceVariant)}
      indentFirstProseBlock
      groupNonImageAttachments
    />
  );
}

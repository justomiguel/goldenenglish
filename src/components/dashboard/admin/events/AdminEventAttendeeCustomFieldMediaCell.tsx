"use client";

import { ExternalLink } from "lucide-react";
import { shouldRenderEventFieldAsImage } from "@/lib/events/eventUploadPathDisplay";
import type { EventAttendeeCustomFieldValue } from "@/lib/dashboard/events/loadEventAttendeeCustomFieldValues";

interface AdminEventAttendeeCustomFieldMediaCellProps {
  field: EventAttendeeCustomFieldValue | null;
  emptyLabel: string;
  openFileLabel: string;
  imageAltTemplate: string;
  size?: "sm" | "md";
}

function formatImageAlt(template: string, label: string): string {
  return template.replace("{{label}}", label);
}

export function AdminEventAttendeeCustomFieldMediaCell({
  field,
  emptyLabel,
  openFileLabel,
  imageAltTemplate,
  size = "sm",
}: AdminEventAttendeeCustomFieldMediaCellProps) {
  if (!field?.displayValue.trim()) {
    return <span className="text-sm text-[var(--color-muted-foreground)]">{emptyLabel}</span>;
  }

  const asImage = shouldRenderEventFieldAsImage(field.fieldType, field.fileStoragePath);
  const previewUrl = field.previewUrl?.trim() || null;
  const thumbClass =
    size === "md"
      ? "max-h-28 max-w-full rounded-md object-contain ring-1 ring-[var(--color-border)]"
      : "h-12 w-12 rounded-md object-cover ring-1 ring-[var(--color-border)]";

  if (asImage && previewUrl) {
    return (
      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={openFileLabel}
        aria-label={openFileLabel}
        className="inline-flex max-w-full flex-col items-start gap-1 overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt={formatImageAlt(imageAltTemplate, field.label)}
          className={thumbClass}
        />
      </a>
    );
  }

  if (previewUrl) {
    return (
      <a
        href={previewUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={openFileLabel}
        aria-label={openFileLabel}
        className="inline-flex min-h-9 max-w-full items-center gap-1.5 text-sm font-medium text-[var(--color-primary-dark)] hover:underline"
      >
        <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="truncate">{field.displayValue}</span>
      </a>
    );
  }

  return (
    <span className="truncate text-sm text-[var(--color-foreground)]" title={field.displayValue}>
      {field.displayValue}
    </span>
  );
}

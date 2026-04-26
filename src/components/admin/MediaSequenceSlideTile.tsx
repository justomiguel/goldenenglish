"use client";

import {
  FilePenLine,
  FileSpreadsheet,
  FileText,
  Files,
  Headphones,
  Image as ImageIcon,
  MonitorPlay,
  Presentation,
  Video,
} from "lucide-react";
import type { Slide } from "yet-another-react-lightbox";
import {
  classifyDocumentAttachmentKind,
  type AttachmentDisplayKind,
} from "@/lib/learning-tasks/attachmentDisplayKind";

const RAIL_SURFACE: Record<AttachmentDisplayKind, string> = {
  embed:
    "bg-[color-mix(in_srgb,var(--color-accent)_34%,var(--color-muted))] text-[var(--color-accent)]",
  pdf:
    "bg-[color-mix(in_srgb,var(--color-secondary)_26%,var(--color-muted))] text-[var(--color-secondary)]",
  word:
    "bg-[color-mix(in_srgb,var(--color-primary)_30%,var(--color-muted))] text-[var(--color-primary)]",
  spreadsheet:
    "bg-[color-mix(in_srgb,var(--color-success)_28%,var(--color-muted))] text-[var(--color-success)]",
  presentation:
    "bg-[color-mix(in_srgb,var(--color-warning)_32%,var(--color-muted))] text-[var(--color-warning)]",
  office:
    "bg-[color-mix(in_srgb,var(--color-warning)_18%,var(--color-muted))] text-[var(--color-warning)]",
  image:
    "bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-muted))] text-[var(--color-accent)]",
  audio:
    "bg-[color-mix(in_srgb,var(--color-primary)_22%,var(--color-muted))] text-[var(--color-primary)]",
  video:
    "bg-[color-mix(in_srgb,var(--color-primary)_36%,var(--color-muted))] text-[var(--color-primary)]",
  other:
    "bg-[color-mix(in_srgb,var(--color-border)_55%,var(--color-muted))] text-[var(--color-muted-foreground)]",
};

export function getSlideTileKind(slide: Slide): AttachmentDisplayKind {
  if (slide.type === "embed") return "embed";
  if (slide.type === "video") return "video";
  if (slide.type === "document") {
    return classifyDocumentAttachmentKind(slide.mime, slide.title) ?? "office";
  }
  return "image";
}

const iconStroke = { strokeWidth: 2.1 } as const;

function TileIcon({ kind, className }: { kind: AttachmentDisplayKind; className: string }) {
  switch (kind) {
    case "embed":
      return <MonitorPlay className={className} aria-hidden {...iconStroke} />;
    case "pdf":
      return <FileText className={className} aria-hidden {...iconStroke} />;
    case "word":
      return <FilePenLine className={className} aria-hidden {...iconStroke} />;
    case "spreadsheet":
      return <FileSpreadsheet className={className} aria-hidden {...iconStroke} />;
    case "presentation":
      return <Presentation className={className} aria-hidden {...iconStroke} />;
    case "office":
      return <Files className={className} aria-hidden {...iconStroke} />;
    case "video":
      return <Video className={className} aria-hidden {...iconStroke} />;
    case "audio":
      return <Headphones className={className} aria-hidden {...iconStroke} />;
    default:
      return <ImageIcon className={className} aria-hidden {...iconStroke} />;
  }
}

interface MediaSequenceSlideTileProps {
  title: string;
  typeLabel: string;
  kind: AttachmentDisplayKind;
  index: number;
  onPress: () => void;
}

export function MediaSequenceSlideTile({ title, typeLabel, kind, index, onPress }: MediaSequenceSlideTileProps) {
  const rail = RAIL_SURFACE[kind];
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={`${title} — ${typeLabel}`}
      className="group relative flex w-full min-h-[3.35rem] overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] text-left shadow-[var(--shadow-soft)] transition-[box-shadow,transform] duration-200 ease-out hover:shadow-[var(--shadow-card)] motion-safe:hover:-translate-y-px active:translate-y-0 motion-safe:active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
    >
      <span
        className={`relative flex w-12 shrink-0 flex-col items-center justify-center border-r border-[color-mix(in_srgb,var(--color-border)_70%,transparent)] ${rail}`}
        aria-hidden
      >
        <span className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_40%_28%,currentColor,transparent_58%)]" />
        <TileIcon kind={kind} className="relative h-5 w-5 shrink-0 drop-shadow-[0_1px_1px_color-mix(in_srgb,var(--color-foreground)_10%,transparent)]" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 py-2 pl-2.5 pr-9">
        <span className="text-[0.58rem] font-semibold uppercase tracking-[0.12em] text-[var(--color-muted-foreground)]">
          {typeLabel}
        </span>
        <span className="line-clamp-2 text-xs font-semibold leading-snug text-[var(--color-foreground)]">{title}</span>
      </span>
      <span
        className="pointer-events-none absolute right-1.5 top-1.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-background)_86%,transparent)] px-1 font-mono text-[0.58rem] font-semibold tabular-nums text-[var(--color-muted-foreground)]"
        aria-hidden
      >
        {index + 1}
      </span>
    </button>
  );
}

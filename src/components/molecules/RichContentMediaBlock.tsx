import Link from "next/link";
import { Music, Video } from "lucide-react";
import { resolveBlogEmbedDisplay } from "@/lib/blog/resolveBlogEmbedIframeSrc";
import { RichContentFileAttachment } from "@/components/molecules/RichContentFileAttachment";
import type {
  RichContentAudioSegment,
  RichContentDisplayLabels,
  RichContentEmbedSegment,
  RichContentFileSegment,
  RichContentVideoSegment,
} from "@/lib/rich-content/richContentDisplayTypes";

type RichContentMediaBlockProps = {
  segment:
    | RichContentFileSegment
    | RichContentAudioSegment
    | RichContentVideoSegment
    | RichContentEmbedSegment;
  labels: RichContentDisplayLabels;
};

export function RichContentMediaBlock({ segment, labels }: RichContentMediaBlockProps) {
  if (segment.kind === "file") {
    return (
      <RichContentFileAttachment href={segment.href} label={segment.label} labels={labels} />
    );
  }
  if (segment.kind === "audio") {
    return <RichContentAudioCard src={segment.src} label={labels.audioLabel} />;
  }
  if (segment.kind === "video") {
    return <RichContentVideoCard src={segment.src} label={labels.videoLabel} />;
  }
  return <RichContentEmbedCard src={segment.src} />;
}

function RichContentAudioCard({ src, label }: { src: string; label: string }) {
  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
        <Music className="h-4 w-4" aria-hidden />
        {label}
      </p>
      <audio controls preload="metadata" src={src} className="w-full" />
    </div>
  );
}

function RichContentVideoCard({ src, label }: { src: string; label: string }) {
  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-foreground)]">
        <Video className="h-4 w-4" aria-hidden />
        {label}
      </p>
      <video controls preload="metadata" src={src} className="max-h-[480px] w-full rounded-[var(--layout-border-radius)]" />
    </div>
  );
}

function RichContentEmbedCard({ src }: { src: string }) {
  const display = resolveBlogEmbedDisplay(src);

  if (display.mode === "link") {
    return (
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <Link
          href={display.href}
          className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          {display.href}
        </Link>
      </div>
    );
  }

  const frameClassName =
    display.mode === "video"
      ? "aspect-video w-full overflow-hidden rounded-[var(--layout-border-radius)]"
      : "min-h-[320px] w-full overflow-hidden rounded-[var(--layout-border-radius)] sm:min-h-[480px]";

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className={frameClassName}>
        <iframe
          src={display.embedUrl}
          title={src}
          className="h-full min-h-[inherit] w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  );
}

import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { PulsarClientInstituteMark } from "@/components/organisms/pulsar/PulsarClientInstituteMark";

export interface PulsarClientPreviewCardProps {
  displayName: string;
  href: string;
  visitText: string;
  visitLabel: string;
  previewVideoSrc?: string;
  previewPosterSrc?: string;
  logoSrc?: string;
  deferVideo?: boolean;
}

export function PulsarClientPreviewCard({
  displayName,
  href,
  visitText,
  visitLabel,
  previewVideoSrc,
  previewPosterSrc,
  logoSrc,
  deferVideo = false,
}: PulsarClientPreviewCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={visitLabel}
      className="group block min-h-[44px] text-left transition-colors"
    >
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="relative aspect-video bg-[var(--color-muted)]">
          {previewVideoSrc && !deferVideo ? (
            <>
              <video
                className="h-full w-full object-cover object-top motion-reduce:hidden"
                autoPlay
                muted
                loop
                playsInline
                poster={previewPosterSrc}
                aria-hidden
              >
                <source src={previewVideoSrc} type="video/webm" />
              </video>
              {previewPosterSrc ? (
                <Image
                  src={previewPosterSrc}
                  alt=""
                  width={1440}
                  height={900}
                  className="hidden h-full w-full object-cover object-top motion-reduce:block"
                />
              ) : null}
            </>
          ) : previewPosterSrc ? (
            <Image
              src={previewPosterSrc}
              alt=""
              width={1440}
              height={900}
              className="h-full w-full object-cover object-top"
            />
          ) : null}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {logoSrc ? <PulsarClientInstituteMark src={logoSrc} /> : null}
          <h2 className="truncate font-display text-xl font-medium text-[var(--color-foreground)] group-hover:text-[var(--color-primary)]">
            {displayName}
          </h2>
        </div>
        <p className="inline-flex shrink-0 items-center gap-2 text-sm text-[var(--color-primary)]">
          <ExternalLink className="h-4 w-4" aria-hidden />
          <span>{visitText}</span>
        </p>
      </div>
    </a>
  );
}

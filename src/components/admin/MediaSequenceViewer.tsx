"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import Lightbox, { type GenericSlide, type RenderSlideProps, type Slide } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Video from "yet-another-react-lightbox/plugins/video";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { Button } from "@/components/atoms/Button";
import type { ContentTemplateBlock, ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];

interface EmbedSlide extends GenericSlide {
  type: "embed";
  src: string;
  title?: string;
  description?: string;
}

interface DocumentSlide extends GenericSlide {
  type: "document";
  src: string;
  mime?: string;
  title?: string;
  description?: string;
}

declare module "yet-another-react-lightbox" {
  interface SlideTypes {
    embed: EmbedSlide;
    document: DocumentSlide;
  }
}

interface MediaSequenceViewerProps {
  content: ContentTemplateLibraryRow;
  labels: Labels;
}

const assetUrl = (storagePath: string) => `/api/admin/academic/content-assets?path=${encodeURIComponent(storagePath)}`;

export function MediaSequenceViewer({ content, labels }: MediaSequenceViewerProps) {
  const [index, setIndex] = useState(-1);
  const slides = useMemo(() => buildSlides(content), [content]);

  if (slides.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-foreground)]">{labels.mediaViewerTitle}</h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">{labels.mediaViewerLead}</p>
        </div>
        <Button type="button" variant="secondary" onClick={() => setIndex(0)}>
          {labels.mediaViewerOpen}
        </Button>
      </div>
      <ol className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {slides.map((slide, slideIndex) => (
          <li key={`${slide.type ?? "image"}:${slideIndex}`}>
            <button
              type="button"
              className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left transition hover:bg-[var(--color-muted)]"
              onClick={() => setIndex(slideIndex)}
            >
              <span className="block text-xs font-medium uppercase tracking-wide text-[var(--color-muted-foreground)]">
                {labelForSlide(slide, labels)}
              </span>
              <span className="mt-1 block truncate font-semibold text-[var(--color-foreground)]">
                {String(slide.title ?? labels.mediaViewerUntitled)}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <Lightbox
        open={index >= 0}
        close={() => setIndex(-1)}
        index={index}
        slides={slides}
        plugins={[Captions, Fullscreen, Thumbnails, Video, Zoom]}
        video={{ controls: true, playsInline: true, preload: "metadata" }}
        captions={{ showToggle: true, descriptionTextAlign: "center" }}
        render={{ slide: (props) => renderCustomSlide(props, labels) }}
      />
    </section>
  );
}

function renderCustomSlide({ slide }: RenderSlideProps, labels: Labels): ReactNode {
  if (slide.type === "embed") {
    return <iframe className="aspect-video w-[min(80rem,90vw)] rounded-[var(--layout-border-radius)]" src={slide.src} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen title={String(slide.title ?? "Embedded video")} />;
  }
  if (slide.type === "document") {
    if (slide.mime !== "application/pdf") {
      return (
        <div className="max-w-lg rounded-[var(--layout-border-radius)] bg-[var(--color-background)] p-6 text-center text-[var(--color-foreground)]">
          <p className="text-lg font-semibold">{String(slide.title ?? "Document")}</p>
          <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">{slide.mime ?? labels.mediaViewerOfficeDocument}</p>
          <a className="mt-4 inline-flex rounded-[var(--layout-border-radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)]" href={slide.src} target="_blank" rel="noreferrer">
            {labels.mediaViewerOpenDocument}
          </a>
        </div>
      );
    }
    return <iframe className="h-[80vh] w-[min(64rem,90vw)] rounded-[var(--layout-border-radius)] bg-white" src={slide.src} title={String(slide.title ?? "Document")} />;
  }
  return undefined;
}

function buildSlides(content: ContentTemplateLibraryRow): Slide[] {
  const assetById = new Map(content.assets.map((asset) => [asset.id, asset]));
  return content.blocks.flatMap((block) => {
    const asset = block.assetId ? assetById.get(block.assetId) : null;
    const title = String(block.payload.label ?? asset?.label ?? "Untitled");
    return blockToSlide(block, asset, title);
  });
}

function blockToSlide(
  block: ContentTemplateBlock,
  asset: ContentTemplateLibraryRow["assets"][number] | null | undefined,
  title: string,
): Slide[] {
  const embedUrl = typeof block.payload.embedUrl === "string" ? block.payload.embedUrl : asset?.embedUrl;
  const storagePath = asset?.storagePath;
  const mime = asset?.mimeType ?? (typeof block.payload.mime === "string" ? block.payload.mime : null);
  if (block.kind === "video_embed" && embedUrl) return [{ type: "embed", src: embedUrl, title }];
  if (!storagePath || !mime) return [];
  const src = assetUrl(storagePath);
  if (block.kind === "image" || mime.startsWith("image/")) return [{ src, alt: title, title }];
  if (block.kind === "audio" || mime.startsWith("audio/")) return [];
  if (mime.startsWith("video/")) return [{ type: "video", title, controls: true, sources: [{ src, type: mime }] }];
  if (block.kind === "pdf" || isDocumentMime(mime)) return [{ type: "document", src, title, mime, description: mime }];
  return [];
}

function isDocumentMime(mime: string) {
  return mime === "application/pdf"
    || mime === "application/msword"
    || mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    || mime === "application/vnd.ms-excel"
    || mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    || mime === "application/vnd.ms-powerpoint"
    || mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation";
}

function labelForSlide(slide: Slide, labels: Labels) {
  if (slide.type === "video" || slide.type === "embed") return labels.mediaViewerVideo;
  if (slide.type === "document") return labels.mediaViewerDocument;
  return labels.mediaViewerImage;
}

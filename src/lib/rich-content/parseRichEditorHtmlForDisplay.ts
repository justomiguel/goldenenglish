import type {
  RichContentDisplaySegment,
  RichContentEmbedSegment,
  RichContentFileSegment,
} from "@/lib/rich-content/richContentDisplayTypes";
import {
  extractHtmlAttribute,
  isRichContentFileAttachmentLink,
  stripRichAnchorLabel,
} from "@/lib/rich-content/isRichContentFileAttachmentLink";
import {
  forEachRichContentParagraphBlock,
  normalizeRichParagraphInner,
} from "@/lib/rich-content/matchRichContentParagraphBlock";

type MediaMatch = {
  index: number;
  length: number;
  segment: Exclude<RichContentDisplaySegment, { kind: "html" }>;
};

const YOUTUBE_BLOCK =
  /(?:<div\s+data-youtube-video=""[^>]*>\s*)?<iframe\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/iframe>\s*(?:<\/div>)?/i;
const AUDIO_IN_PARAGRAPH = /^<audio\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/audio>$/i;
const VIDEO_IN_PARAGRAPH = /^<video\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/video>$/i;
const ANCHOR_ONLY_IN_PARAGRAPH = /^<a\s+([^>]*?)>([\s\S]*?)<\/a>$/i;

function findEarliestFileLinkBlock(
  slice: string,
): { index: number; length: number; segment: RichContentFileSegment } | null {
  let best: { index: number; length: number; segment: RichContentFileSegment } | null = null;

  forEachRichContentParagraphBlock(slice, (paragraph) => {
    const normalized = normalizeRichParagraphInner(paragraph.inner);
    const anchor = normalized.match(ANCHOR_ONLY_IN_PARAGRAPH);
    if (!anchor) return;

    const href = extractHtmlAttribute(anchor[1], "href");
    if (!href || !isRichContentFileAttachmentLink(href, anchor[1], anchor[2])) return;

    const candidate = {
      index: paragraph.index,
      length: paragraph.length,
      segment: {
        kind: "file" as const,
        href,
        label: stripRichAnchorLabel(anchor[2]) || href,
      },
    };

    if (!best || candidate.index < best.index) {
      best = candidate;
    }
  });

  return best;
}

function findEarliestAudioBlock(
  slice: string,
): { index: number; length: number; segment: { kind: "audio"; src: string } } | null {
  let best: { index: number; length: number; segment: { kind: "audio"; src: string } } | null =
    null;

  forEachRichContentParagraphBlock(slice, (paragraph) => {
    const normalized = normalizeRichParagraphInner(paragraph.inner);
    const audio = normalized.match(AUDIO_IN_PARAGRAPH);
    if (!audio) return;

    const candidate = {
      index: paragraph.index,
      length: paragraph.length,
      segment: { kind: "audio" as const, src: audio[1] },
    };

    if (!best || candidate.index < best.index) {
      best = candidate;
    }
  });

  return best;
}

function findEarliestVideoBlock(
  slice: string,
): { index: number; length: number; segment: { kind: "video"; src: string } } | null {
  let best: { index: number; length: number; segment: { kind: "video"; src: string } } | null =
    null;

  forEachRichContentParagraphBlock(slice, (paragraph) => {
    const normalized = normalizeRichParagraphInner(paragraph.inner);
    const video = normalized.match(VIDEO_IN_PARAGRAPH);
    if (!video) return;

    const candidate = {
      index: paragraph.index,
      length: paragraph.length,
      segment: { kind: "video" as const, src: video[1] },
    };

    if (!best || candidate.index < best.index) {
      best = candidate;
    }
  });

  return best;
}

function findEarliestMediaMatch(html: string, from: number): MediaMatch | null {
  const slice = html.slice(from);
  let best: MediaMatch | null = null;

  const consider = (index: number, length: number, segment: MediaMatch["segment"]) => {
    if (index < 0) return;
    if (!best || index < best.index) {
      best = { index: from + index, length, segment };
    }
  };

  const youtube = slice.match(YOUTUBE_BLOCK);
  if (youtube?.index != null && /youtube|vimeo/i.test(youtube[1])) {
    consider(youtube.index, youtube[0].length, { kind: "embed", src: youtube[1] });
  }

  const audio = findEarliestAudioBlock(slice);
  if (audio) {
    consider(audio.index, audio.length, audio.segment);
  }

  const video = findEarliestVideoBlock(slice);
  if (video) {
    consider(video.index, video.length, video.segment);
  }

  const file = findEarliestFileLinkBlock(slice);
  if (file) {
    consider(file.index, file.length, file.segment);
  }

  return best;
}

/** Splits editor HTML into prose chunks and styled media blocks (SSR-safe). */
export function parseRichEditorHtmlForDisplay(html: string): RichContentDisplaySegment[] {
  const trimmed = html.trim();
  if (!trimmed) return [];

  const segments: RichContentDisplaySegment[] = [];
  let pos = 0;

  while (pos < trimmed.length) {
    const match = findEarliestMediaMatch(trimmed, pos);
    if (!match) {
      const tail = trimmed.slice(pos).trim();
      if (tail) segments.push({ kind: "html", html: tail });
      break;
    }

    if (match.index > pos) {
      const prose = trimmed.slice(pos, match.index).trim();
      if (prose) segments.push({ kind: "html", html: prose });
    }

    segments.push(match.segment);
    pos = match.index + match.length;
  }

  return segments;
}

export function isRichContentEmbedSegment(
  segment: RichContentDisplaySegment,
): segment is RichContentEmbedSegment {
  return segment.kind === "embed";
}

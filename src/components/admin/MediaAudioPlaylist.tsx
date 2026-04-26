"use client";

import { useMemo, useState } from "react";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import type { ContentTemplateLibraryRow } from "@/lib/learning-tasks/loadContentTemplateLibrary";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["adminContents"];

type AudioTrack = {
  id: string;
  title: string;
  src: string;
  mime: string;
};

interface MediaAudioPlaylistProps {
  content: ContentTemplateLibraryRow;
  labels: Labels;
}

const assetUrl = (storagePath: string) => `/api/admin/academic/content-assets?path=${encodeURIComponent(storagePath)}`;

export function MediaAudioPlaylist({ content, labels }: MediaAudioPlaylistProps) {
  const tracks = useMemo(() => buildAudioTracks(content), [content]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasStartedSequence, setHasStartedSequence] = useState(false);
  const active = tracks[activeIndex] ?? null;

  if (!active) return null;

  const nextTrack = () => setActiveIndex((current) => (current + 1) % tracks.length);
  const prevTrack = () => setActiveIndex((current) => (current - 1 + tracks.length) % tracks.length);

  return (
    <section className="space-y-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <header>
        <h3 className="text-base font-semibold text-[var(--color-foreground)]">{labels.audioPlaylistTitle}</h3>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{labels.audioPlaylistLead}</p>
      </header>
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-3">
        <p className="mb-2 text-sm font-medium text-[var(--color-foreground)]">
          {labels.audioPlaylistNowPlaying.replace("{title}", active.title)}
        </p>
        <AudioPlayer
          src={active.src}
          preload="metadata"
          showSkipControls={tracks.length > 1}
          showJumpControls
          onClickNext={nextTrack}
          onClickPrevious={prevTrack}
          onEnded={nextTrack}
          onPlay={() => setHasStartedSequence(true)}
          autoPlayAfterSrcChange={hasStartedSequence}
          i18nAriaLabels={{
            player: labels.audioPlaylistPlayerLabel,
            previous: labels.audioPlaylistPrevious,
            next: labels.audioPlaylistNext,
          }}
        />
      </div>
      <ol className="space-y-2">
        {tracks.map((track, index) => (
          <li key={track.id}>
            <button
              type="button"
              className={`w-full rounded-[var(--layout-border-radius)] border px-3 py-2 text-left text-sm transition ${index === activeIndex ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-foreground)]" : "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"}`}
              onClick={() => setActiveIndex(index)}
            >
              <span className="block font-medium">{track.title}</span>
              <span className="mt-0.5 block text-xs">{track.mime}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function buildAudioTracks(content: ContentTemplateLibraryRow): AudioTrack[] {
  const assetById = new Map(content.assets.map((asset) => [asset.id, asset]));
  return content.blocks.flatMap((block) => {
    const asset = block.assetId ? assetById.get(block.assetId) : null;
    const mime = asset?.mimeType ?? (typeof block.payload.mime === "string" ? block.payload.mime : "");
    if (!asset?.storagePath || !(block.kind === "audio" || mime.startsWith("audio/"))) return [];
    return [{
      id: block.id,
      title: String(block.payload.label ?? asset.label ?? "Audio"),
      src: assetUrl(asset.storagePath),
      mime,
    }];
  });
}

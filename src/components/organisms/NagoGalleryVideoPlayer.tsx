"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { NagoGalleryVideo } from "@/lib/landing/nagoGalleryCatalog";

export interface NagoGalleryVideoPlayerProps {
  item: NagoGalleryVideo;
  playLabel: string;
  pauseLabel: string;
  seekLabel: string;
}

export function NagoGalleryVideoPlayer({
  item,
  playLabel,
  pauseLabel,
  seekLabel,
}: NagoGalleryVideoPlayerProps) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const onTime = () => setTime(node.currentTime || 0);
    const onMeta = () => setDuration(Number.isFinite(node.duration) ? node.duration : 0);
    const onProgress = () => {
      const ranges = node.buffered;
      if (!ranges.length || !Number.isFinite(node.duration)) return;
      setBuffered(ranges.end(ranges.length - 1));
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    node.addEventListener("timeupdate", onTime);
    node.addEventListener("loadedmetadata", onMeta);
    node.addEventListener("progress", onProgress);
    node.addEventListener("play", onPlay);
    node.addEventListener("pause", onPause);
    try {
      const pending = node.play();
      if (pending && typeof pending.catch === "function") void pending.catch(() => undefined);
    } catch {
      /* jsdom and a blocked autoplay leave the paused state. */
    }
    return () => {
      node.removeEventListener("timeupdate", onTime);
      node.removeEventListener("loadedmetadata", onMeta);
      node.removeEventListener("progress", onProgress);
      node.removeEventListener("play", onPlay);
      node.removeEventListener("pause", onPause);
    };
  }, [item.src]);

  const toggle = () => {
    const node = ref.current;
    if (!node) return;
    if (node.paused) {
      try {
        const pending = node.play();
        if (pending && typeof pending.catch === "function") void pending.catch(() => undefined);
      } catch {
        setPlaying(false);
      }
      return;
    }
    node.pause();
  };

  const seek = (value: number) => {
    const node = ref.current;
    if (!node) return;
    node.currentTime = value;
    setTime(value);
  };

  const playedPct = duration > 0 ? (time / duration) * 100 : 0;
  const bufferPct = duration > 0 ? Math.min(100, (buffered / duration) * 100) : 0;

  return (
    <div className="flex w-fit max-w-[min(92vw,1100px)] flex-col items-center">
      <video
        ref={ref}
        src={item.src}
        poster={item.poster}
        width={item.width}
        height={item.height}
        playsInline
        className="h-auto max-h-[72vh] w-auto max-w-full bg-black object-contain"
      />
      <div className="mt-3 flex w-full min-w-[16rem] items-center gap-3">
        <button
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-white"
          onClick={toggle}
          aria-label={playing ? pauseLabel : playLabel}
        >
          {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
        </button>
        <div className="relative h-11 min-w-0 flex-1">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 bg-[var(--nago-ink-muted)]" />
          <div
            className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 bg-[var(--nago-heading-solid)]"
            style={{ width: `${bufferPct}%` }}
          />
          <div
            className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 bg-[var(--nago-gold)]"
            style={{ width: `${playedPct}%` }}
          />
          <input
            type="range"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(time, duration || 0)}
            aria-label={seekLabel}
            onChange={(event) => seek(Number(event.target.value))}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold text-white">
          {formatClock(time)} / {formatClock(duration)}
        </span>
      </div>
    </div>
  );
}

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const rest = total % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

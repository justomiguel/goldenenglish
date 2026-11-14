"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

export interface LioraGalleryVideoSlideProps {
  src: string;
  poster: string;
  playLabel: string;
  pauseLabel: string;
  active: boolean;
  onReady: () => void;
}

export function LioraGalleryVideoSlide({
  src,
  poster,
  playLabel,
  pauseLabel,
  active,
  onReady,
}: LioraGalleryVideoSlideProps) {
  const [node, setNode] = useState<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    node.addEventListener("play", onPlay);
    node.addEventListener("pause", onPause);
    if (node.readyState >= 2) onReady();
    if (active && !reduced) {
      const pending = node.play();
      if (pending && typeof pending.catch === "function") {
        void pending.catch(() => setPlaying(false));
      }
    }
    return () => {
      node.pause();
      node.removeEventListener("play", onPlay);
      node.removeEventListener("pause", onPause);
    };
  }, [node, src, active, onReady]);

  const toggle = () => {
    if (!node) return;
    if (node.paused) {
      const pending = node.play();
      if (pending && typeof pending.catch === "function") {
        void pending.catch(() => setPlaying(false));
      }
      return;
    }
    node.pause();
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <video
        ref={setNode}
        src={src}
        poster={poster}
        playsInline
        className="h-full w-full object-contain"
        onLoadedData={onReady}
      />
      <button
        type="button"
        className="absolute bottom-3 start-3 inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full bg-black/70 px-3 text-white"
        onClick={toggle}
        aria-label={playing ? pauseLabel : playLabel}
      >
        {playing ? (
          <Pause className="h-4 w-4" aria-hidden />
        ) : (
          <Play className="h-4 w-4" aria-hidden />
        )}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

export interface CentroListoLogoMarkProps {
  size?: "sm" | "md";
  showWordmark?: boolean;
}

/**
 * Logo A — "El Hilo que se Desenreda":
 * Single continuous calligraphic loop in serene forest sage (--color-primary)
 * wrapping a warm terracotta center seed (--color-accent), paired with the
 * serif/italic wordmark.
 */
export function CentroListoLogoMark({
  size = "md",
  showWordmark = true,
}: CentroListoLogoMarkProps) {
  const dim = size === "sm" ? 26 : 32;

  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 88 88"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M62 28C54 20 39 19 29 27C19 35 19 52 29 61C39 70 56 68 65 56C68 52 67 44 60 42C53 40 45 45 46 51"
          stroke="var(--color-primary)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="48" cy="44" r="5.5" fill="var(--color-accent)" />
      </svg>
      {showWordmark ? (
        <span className="font-[family-name:var(--font-display)] text-xl font-normal tracking-tight text-[var(--color-foreground)]">
          centro<em className="font-normal italic text-[var(--color-primary)]">listo</em>
        </span>
      ) : null}
    </span>
  );
}

export interface CentroListoGenerativeStageProps {
  noiseCaption: string;
  resolvedCaption: string;
  replayLabel: string;
  activeTenantsCount: number;
  tenantsLabel: string;
  compact?: boolean;
}

/**
 * Creative Hero generative animation: tangled everyday threads dissolve and
 * untangle into Logo A's single serene spiral and warm center seed.
 */
export function CentroListoGenerativeStage({
  noiseCaption,
  resolvedCaption,
  replayLabel,
  activeTenantsCount,
  tenantsLabel,
  compact = false,
}: CentroListoGenerativeStageProps) {
  const markSize = compact ? 120 : 210;
  const [cycle, setCycle] = useState(0);

  return (
    <div
      data-testid="centrolisto-generative-logo"
      className={`relative flex flex-col items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/65 ${compact ? "p-4" : "p-6 sm:p-8"}`}
    >
      <style>{`
        @keyframes cl-tangle-dissolve-a {
          0% { stroke-dashoffset: 0; opacity: 0.72; transform: translate(-12px, -8px) rotate(-10deg); }
          45% { opacity: 0.28; transform: translate(0, 0) rotate(0deg); }
          68%, 100% { stroke-dashoffset: 340; opacity: 0; transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes cl-tangle-dissolve-b {
          0% { stroke-dashoffset: 0; opacity: 0.58; transform: translate(12px, 10px) rotate(12deg); }
          48% { opacity: 0.22; transform: translate(0, 0) rotate(0deg); }
          70%, 100% { stroke-dashoffset: 340; opacity: 0; transform: translate(0, 0) rotate(0deg); }
        }
        @keyframes cl-serene-draw {
          0%, 20% { stroke-dashoffset: 360; opacity: 0.15; }
          35% { opacity: 1; }
          82%, 100% { stroke-dashoffset: 0; opacity: 1; }
        }
        @keyframes cl-seed-bloom {
          0%, 58% { transform: scale(0.6); opacity: 0; }
          86%, 100% { transform: scale(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .cl-anim-tangle-a, .cl-anim-tangle-b { opacity: 0 !important; animation: none !important; }
          .cl-anim-loop, .cl-anim-seed { stroke-dashoffset: 0 !important; opacity: 1 !important; transform: none !important; animation: none !important; }
        }
      `}</style>

      <div className="flex w-full items-center justify-between gap-2 text-xs text-[var(--color-muted-foreground)]">
        <span className="italic">{noiseCaption}</span>
        <button
          type="button"
          onClick={() => setCycle((c) => c + 1)}
          aria-label={replayLabel}
          title={replayLabel}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-background)]"
        >
          <RotateCcw className="h-3.5 w-3.5 text-[var(--color-primary)]" aria-hidden />
        </button>
      </div>

      <div key={cycle} className="my-4 flex items-center justify-center">
        <svg
          width={markSize}
          height={markSize}
          viewBox="0 0 220 220"
          fill="none"
          role="img"
          aria-label={`centrolisto — ${resolvedCaption}`}
        >
          <path
            className="cl-anim-tangle-a"
            d="M36 96C58 34 156 42 174 96C192 150 64 184 52 122C40 60 158 72 138 142"
            stroke="var(--color-muted-foreground)"
            strokeWidth="1.8"
            strokeLinecap="round"
            style={{
              strokeDasharray: 340,
              transformOrigin: "110px 110px",
              animation: "cl-tangle-dissolve-a 3.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
            }}
          />
          <path
            className="cl-anim-tangle-b"
            d="M172 68C118 28 38 88 68 152C98 216 188 136 146 84C104 32 62 126 116 154"
            stroke="var(--color-accent)"
            strokeWidth="1.6"
            strokeLinecap="round"
            style={{
              strokeDasharray: 340,
              transformOrigin: "110px 110px",
              animation: "cl-tangle-dissolve-b 3.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
            }}
          />
          <path
            className="cl-anim-loop"
            d="M155 70C135 50 97 47 72 67C47 87 47 130 72 152C97 174 140 170 162 140C170 130 167 110 150 105C133 100 112 112 115 127"
            stroke="var(--color-primary)"
            strokeWidth="5.5"
            strokeLinecap="round"
            style={{
              strokeDasharray: 360,
              animation: "cl-serene-draw 3.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
            }}
          />
          <circle
            className="cl-anim-seed"
            cx="120"
            cy="110"
            r="9.5"
            fill="var(--color-accent)"
            style={{
              transformOrigin: "120px 110px",
              animation: "cl-seed-bloom 3.2s cubic-bezier(0.22, 1, 0.36, 1) forwards",
            }}
          />
        </svg>
      </div>

      <div className="w-full border-t border-[var(--color-border)] pt-4 text-center">
        <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-foreground)]">
          centro<em className="italic text-[var(--color-primary)]">listo</em>
          <span className="mx-2 text-[var(--color-border)]">·</span>
          <span className="font-sans text-sm text-[var(--color-muted-foreground)]">
            {resolvedCaption}
          </span>
        </p>
        {compact ? null : (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            <strong className="font-semibold text-[var(--color-foreground)]">
              {activeTenantsCount}
            </strong>{" "}
            {tenantsLabel}
          </p>
        )}
      </div>
    </div>
  );
}

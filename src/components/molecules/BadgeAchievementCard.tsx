"use client";

import Image from "next/image";
import { Lock } from "lucide-react";
import type { ReactNode } from "react";
import type { BadgeAchievementVisual } from "@/lib/badges/resolveBadgeAchievementVisual";
import type { StudentBadgeProgress } from "@/types/studentBadges";

export interface BadgeAchievementCardProps {
  visual: BadgeAchievementVisual;
  categoryLabel: string;
  title: string;
  description?: string;
  statusLine: string;
  imageUrl?: string | null;
  footer?: ReactNode;
  locked?: boolean;
  progress?: StudentBadgeProgress | null;
  progressDetail?: string;
  progressAriaLabel?: string;
}

export function BadgeAchievementCard({
  visual,
  categoryLabel,
  title,
  description,
  statusLine,
  imageUrl,
  footer,
  locked = false,
  progress,
  progressDetail,
  progressAriaLabel,
}: BadgeAchievementCardProps) {
  const { Icon, shellClassName, iconClassName, chipClassName } = visual;
  const muted = locked;

  return (
    <article
      className={`overflow-hidden rounded-[var(--layout-border-radius)] border shadow-[var(--shadow-card)] ${
        muted
          ? "border-[var(--color-border)] bg-[var(--color-muted)]/40 opacity-95"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
      aria-disabled={locked || undefined}
    >
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div
            className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${
              muted ? "opacity-55 grayscale" : ""
            } ${shellClassName}`}
            aria-hidden
          >
            {imageUrl ? (
              <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <Icon className={`h-8 w-8 ${iconClassName}`} strokeWidth={1.75} />
            )}
            {locked ? (
              <span className="absolute inset-0 flex items-center justify-center bg-[var(--color-background)]/55">
                <Lock className="h-5 w-5 text-[var(--color-muted-foreground)]" aria-hidden />
              </span>
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${
                muted
                  ? "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)]"
                  : chipClassName
              }`}
            >
              {categoryLabel}
            </span>
            <h2
              className={`mt-2 font-display text-lg font-bold leading-snug ${
                muted ? "text-[var(--color-muted-foreground)]" : "text-[var(--color-foreground)]"
              }`}
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
                {description}
              </p>
            ) : null}
            <p className="mt-2.5 text-xs font-medium text-[var(--color-muted-foreground)]">{statusLine}</p>
            {locked && progress && progressDetail ? (
              <BadgeProgressBlock
                percent={progress.percent}
                progressDetail={progressDetail}
                progressAriaLabel={progressAriaLabel ?? title}
              />
            ) : null}
          </div>
        </div>
        {footer ? (
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">{footer}</div>
        ) : null}
      </div>
    </article>
  );
}

function BadgeProgressBlock({
  percent,
  progressDetail,
  progressAriaLabel,
}: {
  percent: number;
  progressDetail: string;
  progressAriaLabel: string;
}) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-[var(--color-muted-foreground)]">{progressDetail}</span>
        <span className="font-semibold tabular-nums text-[var(--color-foreground)]">{percent}%</span>
      </div>
      <progress
        className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full accent-[var(--color-primary)] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[var(--color-border)] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[var(--color-primary)]"
        value={percent}
        max={100}
        aria-label={progressAriaLabel}
      />
    </div>
  );
}

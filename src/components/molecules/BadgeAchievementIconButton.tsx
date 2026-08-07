"use client";

import Image from "next/image";
import type { BadgeAchievementVisual } from "@/lib/badges/resolveBadgeAchievementVisual";
import { badgeAchievementToneStyle } from "@/lib/badges/badgeAchievementTone";

export interface BadgeAchievementIconButtonProps {
  visual: BadgeAchievementVisual;
  title: string;
  imageUrl?: string | null;
  locked: boolean;
  progressPercent?: number | null;
  selected?: boolean;
  onClick: () => void;
}

export function BadgeAchievementIconButton({
  visual,
  title,
  imageUrl,
  locked,
  progressPercent,
  selected = false,
  onClick,
}: BadgeAchievementIconButtonProps) {
  const { Icon, shellClassName, iconClassName } = visual;
  const tone = badgeAchievementToneStyle(locked, progressPercent);

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      aria-pressed={selected}
      className={`flex h-14 w-14 items-center justify-center rounded-2xl outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)] sm:h-16 sm:w-16 ${
        selected
          ? "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)]"
          : ""
      }`}
    >
      <span
        className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl ${shellClassName}`}
        style={tone}
        aria-hidden
      >
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />
        ) : (
          <Icon className={`h-7 w-7 sm:h-8 sm:w-8 ${iconClassName}`} strokeWidth={1.75} />
        )}
      </span>
    </button>
  );
}

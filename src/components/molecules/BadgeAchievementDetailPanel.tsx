"use client";

import Image from "next/image";
import { useEffect, useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { Modal } from "@/components/atoms/Modal";
import type { BadgeAchievementVisual } from "@/lib/badges/resolveBadgeAchievementVisual";
import { badgeAchievementToneStyle } from "@/lib/badges/badgeAchievementTone";
import type { StudentBadgeProgress } from "@/types/studentBadges";
import type { AppSurface } from "@/hooks/useAppSurface";

export interface BadgeAchievementDetailPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surface: AppSurface;
  visual: BadgeAchievementVisual;
  categoryLabel: string;
  title: string;
  description?: string;
  statusLine: string;
  imageUrl?: string | null;
  locked: boolean;
  progress?: StudentBadgeProgress | null;
  progressDetail?: string;
  progressAriaLabel?: string;
  closeLabel: string;
  footer?: ReactNode;
}

function isMobileSurface(surface: AppSurface): boolean {
  return surface === "pwa-mobile" || surface === "web-mobile";
}

function DetailBody({
  visual,
  categoryLabel,
  description,
  statusLine,
  imageUrl,
  locked,
  progress,
  progressDetail,
  progressAriaLabel,
  title,
  footer,
}: Omit<
  BadgeAchievementDetailPanelProps,
  "open" | "onOpenChange" | "surface" | "closeLabel"
>) {
  const { Icon, shellClassName, iconClassName, chipClassName } = visual;
  const tone = badgeAchievementToneStyle(locked, progress?.percent);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-4">
        <div
          className={`relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl ${shellClassName}`}
          style={tone}
          aria-hidden
        >
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <Icon className={`h-8 w-8 ${iconClassName}`} strokeWidth={1.75} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span
            className={`inline-flex rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide ${chipClassName}`}
          >
            {categoryLabel}
          </span>
          <p className="mt-2.5 text-xs font-medium text-[var(--color-muted-foreground)]">{statusLine}</p>
        </div>
      </div>
      {description ? (
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">{description}</p>
      ) : null}
      {locked && progress && progressDetail ? (
        <div>
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-medium text-[var(--color-muted-foreground)]">{progressDetail}</span>
            <span className="font-semibold tabular-nums text-[var(--color-foreground)]">
              {progress.percent}%
            </span>
          </div>
          <progress
            className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full accent-[var(--color-primary)] [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-[var(--color-border)] [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-[var(--color-primary)]"
            value={progress.percent}
            max={100}
            aria-label={progressAriaLabel ?? title}
          />
        </div>
      ) : null}
      {footer ? (
        <div className="border-t border-[var(--color-border)] pt-4">{footer}</div>
      ) : null}
    </div>
  );
}

export function BadgeAchievementDetailPanel({
  open,
  onOpenChange,
  surface,
  closeLabel,
  ...detail
}: BadgeAchievementDetailPanelProps) {
  const titleId = useId().replace(/:/g, "");
  const descId = `${titleId}-desc`;
  const mobile = isMobileSurface(surface);

  useEffect(() => {
    if (!open || !mobile) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, mobile, onOpenChange]);

  if (!open) return null;

  if (mobile) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end">
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => onOpenChange(false)}
          aria-hidden
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={detail.description ? descId : undefined}
          className="relative w-full rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3">
            <h2
              id={titleId}
              className="min-w-0 flex-1 truncate font-display text-lg font-semibold text-[var(--color-foreground)]"
            >
              {detail.title}
            </h2>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label={closeLabel}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-muted-foreground)] active:bg-[var(--color-muted)]/50"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div id={descId} className="mt-3">
            <DetailBody {...detail} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={detail.description ? descId : undefined}
      title={detail.title}
      closeLabel={closeLabel}
      dialogClassName="sm:max-w-md"
    >
      <div id={descId}>
        <DetailBody {...detail} />
      </div>
    </Modal>
  );
}

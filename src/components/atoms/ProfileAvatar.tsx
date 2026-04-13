"use client";

import Image from "next/image";
import { User } from "lucide-react";

export interface ProfileAvatarProps {
  url: string | null;
  /** Used for initials fallback and alt when no image */
  displayName: string;
  size: "sm" | "lg" | "xl";
  className?: string;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function ProfileAvatar({ url, displayName, size, className = "" }: ProfileAvatarProps) {
  const dim = size === "xl" ? 152 : size === "lg" ? 128 : 40;
  const text = size === "xl" ? "text-4xl" : size === "lg" ? "text-3xl" : "text-sm";

  if (url) {
    const bypassOptimizer = url.startsWith("blob:") || url.startsWith("data:");
    return (
      <span
        className={`relative inline-block shrink-0 overflow-hidden rounded-full bg-[var(--color-muted)] ring-1 ring-[var(--color-border)] ${className}`}
        style={{ width: dim, height: dim }}
      >
        <Image
          src={url}
          alt={displayName}
          width={dim}
          height={dim}
          unoptimized={bypassOptimizer}
          sizes={size === "xl" ? "152px" : size === "lg" ? "128px" : "40px"}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  const ini = initials(displayName);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] font-semibold text-[var(--color-secondary)] ring-1 ring-[var(--color-border)] ${text} ${className}`}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      {ini === "?" ? <User className="h-1/2 w-1/2 text-[var(--color-muted-foreground)]" aria-hidden /> : ini}
    </span>
  );
}

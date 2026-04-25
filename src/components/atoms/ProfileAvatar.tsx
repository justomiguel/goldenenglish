"use client";

import Image from "next/image";

export interface ProfileAvatarProps {
  url: string | null;
  /** Used for the image alt when a custom avatar exists. */
  displayName: string;
  size: "sm" | "lg" | "xl";
  className?: string;
}

function DefaultProfileAvatarIcon() {
  return (
    <svg
      viewBox="0 0 64 64"
      className="h-[62%] w-[62%] text-[var(--color-muted-foreground)]"
      aria-hidden
      focusable="false"
      data-testid="default-profile-avatar-icon"
    >
      <circle cx="32" cy="24" r="12" fill="currentColor" opacity="0.84" />
      <path
        d="M14 54c2.4-11.2 10-18 18-18s15.6 6.8 18 18"
        fill="currentColor"
        opacity="0.72"
      />
      <path
        d="M10 55c2.8-13.7 11.7-22 22-22s19.2 8.3 22 22"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="4"
        opacity="0.28"
      />
    </svg>
  );
}

export function ProfileAvatar({ url, displayName, size, className = "" }: ProfileAvatarProps) {
  const dim = size === "xl" ? 152 : size === "lg" ? 128 : 40;

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

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--color-muted)] ring-1 ring-[var(--color-border)] ${className}`}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      <DefaultProfileAvatarIcon />
    </span>
  );
}

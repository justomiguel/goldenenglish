"use client";

import { forwardRef, type RefObject } from "react";
import { ProfileAvatarFabMenu } from "@/components/molecules/ProfileAvatarFabMenu";
import type { ProfileAvatarChangeFabLabels } from "@/components/molecules/profileAvatarChangeFabLabels";

export interface ProfileAvatarChangeFabMenuProps {
  anchorRef: RefObject<HTMLDivElement | null>;
  labels: ProfileAvatarChangeFabLabels;
  hintResolved: string;
  onTakePhoto: () => void;
  onUploadFromGallery: () => void;
}

export const ProfileAvatarChangeFabMenu = forwardRef<HTMLDivElement, ProfileAvatarChangeFabMenuProps>(
  function ProfileAvatarChangeFabMenu(
    { anchorRef, labels, hintResolved, onTakePhoto, onUploadFromGallery },
    ref,
  ) {
    return (
      <ProfileAvatarFabMenu ref={ref} anchorRef={anchorRef}>
        <button
          type="button"
          role="menuitem"
          className="flex min-h-[44px] w-full items-center rounded-lg px-4 py-2.5 text-left text-sm font-medium text-[var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-muted))] hover:shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--color-accent)_22%,transparent),0_2px_0_0_color-mix(in_srgb,var(--color-border)_45%,transparent)] focus-visible:bg-[var(--color-muted)] focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          onClick={onTakePhoto}
        >
          {labels.avatarMenuTakePhoto}
        </button>
        <button
          type="button"
          role="menuitem"
          className="flex min-h-[44px] w-full items-center rounded-lg px-4 py-2.5 text-left text-sm font-medium text-[var(--color-foreground)] transition-[transform,box-shadow,background-color] duration-200 ease-out hover:-translate-y-px hover:bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-muted))] hover:shadow-[inset_0_1px_0_0_color-mix(in_srgb,var(--color-accent)_22%,transparent),0_2px_0_0_color-mix(in_srgb,var(--color-border)_45%,transparent)] focus-visible:bg-[var(--color-muted)] focus-visible:outline-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
          onClick={onUploadFromGallery}
        >
          {labels.avatarMenuUpload}
        </button>
        <p className="border-t border-[color-mix(in_srgb,var(--color-accent)_18%,var(--color-border))] px-4 py-2.5 text-xs leading-snug text-[var(--color-muted-foreground)] [overflow-wrap:anywhere]">
          {hintResolved}
        </p>
      </ProfileAvatarFabMenu>
    );
  },
);

ProfileAvatarChangeFabMenu.displayName = "ProfileAvatarChangeFabMenu";

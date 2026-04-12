"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import {
  uploadProfileAvatar,
  type ProfileAvatarErrorKey,
} from "@/lib/profile/uploadProfileAvatar";

export interface ProfileAvatarFormLabels {
  avatarHint: string;
  avatarChoose: string;
  avatarUpload: string;
  avatarSuccess: string;
  avatarError: string;
  avatarTooBig: string;
  avatarInvalidType: string;
  avatarForbidden: string;
  avatarNoFile: string;
}

function labelForError(key: ProfileAvatarErrorKey, labels: ProfileAvatarFormLabels): string {
  switch (key) {
    case "avatarTooBig":
      return labels.avatarTooBig;
    case "avatarInvalidType":
      return labels.avatarInvalidType;
    case "avatarForbidden":
      return labels.avatarForbidden;
    case "avatarNoFile":
      return labels.avatarNoFile;
    default:
      return labels.avatarError;
  }
}

export interface ProfileAvatarPanelProps {
  locale: string;
  avatarDisplayUrl: string | null;
  displayName: string;
  labels: ProfileAvatarFormLabels;
}

export function ProfileAvatarPanel({
  locale,
  avatarDisplayUrl,
  displayName,
  labels,
}: ProfileAvatarPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);
    const fd = new FormData(e.currentTarget);
    fd.set("locale", locale);
    startTransition(async () => {
      const res = await uploadProfileAvatar(fd);
      if (res.ok) {
        setBanner({ tone: "ok", text: labels.avatarSuccess });
        router.refresh();
        return;
      }
      setBanner({ tone: "err", text: labelForError(res.errorKey, labels) });
    });
  }

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <ProfileAvatar
          key={avatarDisplayUrl ?? "none"}
          url={avatarDisplayUrl}
          displayName={displayName}
          size="lg"
        />
        <form className="w-full max-w-md space-y-4" onSubmit={onSubmit}>
          <div>
            <Label htmlFor="profile-avatar-file">{labels.avatarChoose}</Label>
            <input
              id="profile-avatar-file"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="mt-2 block w-full min-h-[44px] cursor-pointer text-sm text-[var(--color-foreground)] file:mr-4 file:rounded-[var(--layout-border-radius)] file:border-0 file:bg-[var(--color-muted)] file:px-4 file:py-2 file:text-sm file:font-medium file:text-[var(--color-foreground)]"
            />
            <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{labels.avatarHint}</p>
          </div>
          <Button type="submit" disabled={pending} isLoading={pending}>
            {labels.avatarUpload}
          </Button>
          {banner ? (
            <p
              role="status"
              className={
                banner.tone === "ok"
                  ? "text-sm text-[var(--color-primary)]"
                  : "text-sm text-[var(--color-error)]"
              }
            >
              {banner.text}
            </p>
          ) : null}
        </form>
      </div>
    </div>
  );
}

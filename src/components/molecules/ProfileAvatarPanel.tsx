"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ReceiptAutoUploadField } from "@/components/molecules/ReceiptAutoUploadField";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";
import type { FileUploadProgressLabels } from "@/types/fileUploadProgressLabels";
import {
  uploadProfileAvatar,
  type ProfileAvatarErrorKey,
} from "@/lib/profile/uploadProfileAvatar";
import { fillProfileAvatarMaxMbTemplate } from "@/lib/profile/avatarUploadLimits";

export interface ProfileAvatarFormLabels {
  avatarHint: string;
  avatarChoose: string;
  avatarUpload: string;
  avatarSuccess: string;
  avatarError: string;
  avatarTooBig: string;
  avatarInvalidType: string;
  avatarSessionMissing: string;
  avatarProfileMissing: string;
  avatarNoFile: string;
}

function labelForError(key: ProfileAvatarErrorKey, labels: ProfileAvatarFormLabels): string {
  switch (key) {
    case "avatarTooBig":
      return fillProfileAvatarMaxMbTemplate(labels.avatarTooBig);
    case "avatarInvalidType":
      return labels.avatarInvalidType;
    case "avatarSessionMissing":
      return labels.avatarSessionMissing;
    case "avatarProfileMissing":
      return labels.avatarProfileMissing;
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
  fileUploadProgress: FileUploadProgressLabels;
  /** When true, omits outer card chrome (use inside a parent section). */
  embedded?: boolean;
  /** Only the upload form (avatar shown separately, e.g. LinkedIn-style hero). */
  uploadOnly?: boolean;
}

export function ProfileAvatarPanel({
  locale,
  avatarDisplayUrl,
  displayName,
  labels,
  fileUploadProgress,
  embedded = false,
  uploadOnly = false,
}: ProfileAvatarPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [lastFileName, setLastFileName] = useState<string | null>(null);

  async function uploadAvatar(file: File) {
    setBanner(null);
    setLastFileName(file.name);
    const fd = new FormData();
    fd.set("locale", locale);
    fd.set("avatar", file);
    setBusy(true);
    try {
      const res = await uploadProfileAvatar(fd);
      if (res.ok) {
        setBanner({ tone: "ok", text: labels.avatarSuccess });
        router.refresh();
        return;
      }
      setBanner({ tone: "err", text: labelForError(res.errorKey, labels) });
    } finally {
      setBusy(false);
    }
  }

  const shell = embedded
    ? "p-0"
    : "rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-card)]";

  return (
    <div className={shell}>
      <div
        className={
          uploadOnly ? "flex flex-col gap-4" : "flex flex-col items-center gap-6 sm:flex-row sm:items-start"
        }
      >
        {uploadOnly ? null : (
          <ProfileAvatar
            key={avatarDisplayUrl ?? "none"}
            url={avatarDisplayUrl}
            displayName={displayName}
            size="lg"
          />
        )}
        <div className={uploadOnly ? "w-full max-w-lg space-y-4" : "w-full max-w-md space-y-4"}>
          <p className="text-sm font-medium text-[var(--color-foreground)]">{labels.avatarChoose}</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            {fillProfileAvatarMaxMbTemplate(labels.avatarHint)}
          </p>
          <ReceiptAutoUploadField
            buttonLabel={labels.avatarUpload}
            inputAriaLabel={labels.avatarUpload}
            accept="image/jpeg,image/png,image/webp"
            inputName="avatar"
            disabled={busy}
            busy={busy}
            selectedFileName={lastFileName}
            fileUploadProgress={fileUploadProgress}
            onFileSelected={uploadAvatar}
          />
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
        </div>
      </div>
    </div>
  );
}

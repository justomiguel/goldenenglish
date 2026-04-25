"use client";

import { Camera } from "lucide-react";
import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import { uploadAdminStudentAvatarAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import {
  PROFILE_AVATAR_MAX_BYTES,
  fillProfileAvatarMaxMbTemplate,
} from "@/lib/profile/avatarUploadLimits";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserAvatarUploadFormProps {
  locale: string;
  targetUserId: string;
  labels: UserLabels;
  onPreview: (file: File) => void;
}

export function AdminUserAvatarUploadForm({
  locale,
  targetUserId,
  labels,
  onPreview,
}: AdminUserAvatarUploadFormProps) {
  const router = useRouter();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  const uploadFile = (file: File | null | undefined) => {
    if (!file) {
      setMessage({ text: labels.detailAvatarErrNoFile, ok: false });
      return;
    }
    if (file.size > PROFILE_AVATAR_MAX_BYTES) {
      setMessage({ text: fillProfileAvatarMaxMbTemplate(labels.detailAvatarErrTooBig), ok: false });
      return;
    }

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("targetUserId", targetUserId);
    formData.set("avatar", file);
    startTransition(async () => {
      const result = await uploadAdminStudentAvatarAction(formData);
      setMessage({ text: result.message, ok: result.ok });
      if (result.ok) {
        onPreview(file);
        router.refresh();
      }
    });
  };

  return (
    <div>
      <input
        ref={inputRef}
        id={inputId}
        name="avatar"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          setMessage(null);
          uploadFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={pending}
        aria-label={labels.detailAvatarUpload}
        title={fillProfileAvatarMaxMbTemplate(labels.detailAvatarHint)}
        onClick={() => inputRef.current?.click()}
        className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border-2 border-[var(--color-surface)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-md transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        <Camera className="h-5 w-5" aria-hidden />
      </button>
      {message ? (
        <p
          role="status"
          className={`mt-2 w-48 text-xs ${message.ok ? "text-[var(--color-primary)]" : "text-[var(--color-error)]"}`}
        >
          {message.text}
        </p>
      ) : null}
    </div>
  );
}

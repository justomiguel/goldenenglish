"use client";

import { type FormEvent, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Dictionary } from "@/types/i18n";
import { uploadAdminStudentAvatarAction } from "@/app/[locale]/dashboard/admin/users/adminUserDetailActions";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
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
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    <form
      className="w-full max-w-[13rem] space-y-3 rounded-[var(--layout-border-radius)] border border-[color-mix(in_srgb,var(--color-accent)_20%,var(--color-border))] bg-[var(--color-background)]/95 p-3"
      onSubmit={onSubmit}
    >
      <div>
        <Label htmlFor={inputId} className="text-xs">
          {labels.detailAvatarChoose}
        </Label>
        <input
          id={inputId}
          name="avatar"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-2 block w-full min-h-[44px] cursor-pointer text-xs text-[var(--color-foreground)] file:mr-3 file:rounded-[var(--layout-border-radius)] file:border-0 file:bg-[var(--color-muted)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--color-foreground)]"
          onChange={(event) => {
            setMessage(null);
            setFile(event.target.files?.[0] ?? null);
          }}
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
          {fillProfileAvatarMaxMbTemplate(labels.detailAvatarHint)}
        </p>
      </div>
      <Button type="submit" size="sm" disabled={pending} isLoading={pending} className="w-full">
        {labels.detailAvatarUpload}
      </Button>
      {message ? (
        <p
          role="status"
          className={message.ok ? "text-xs text-[var(--color-primary)]" : "text-xs text-[var(--color-error)]"}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  );
}

"use client";

import { type FormEvent, useEffect, useId, useState, useTransition } from "react";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import {
  changeMyPassword,
  type MyProfileActionErrorKey,
} from "@/app/[locale]/dashboard/profile/actions";

function mapPwdError(key: MyProfileActionErrorKey, labels: Dictionary["dashboard"]["myProfile"]) {
  switch (key) {
    case "wrongPassword":
      return labels.passwordWrongCurrent;
    case "weakPassword":
      return labels.passwordWeak;
    case "validation":
      return labels.passwordGeneric;
    case "unauthorized":
    default:
      return labels.passwordGeneric;
  }
}

export interface MyProfileChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  labels: Dictionary["dashboard"]["myProfile"];
  onSuccess?: () => void;
}

export function MyProfileChangePasswordModal({
  open,
  onOpenChange,
  locale,
  labels,
  onSuccess,
}: MyProfileChangePasswordModalProps) {
  const titleId = useId();
  const descId = useId();
  const [pending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    queueMicrotask(() => setBanner(null));
  }, [open]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);
    const fd = new FormData(e.currentTarget);
    const newPwd = String(fd.get("new_password") ?? "");
    const confirm = String(fd.get("confirm_password") ?? "");
    if (newPwd !== confirm) {
      setBanner({ tone: "err", text: labels.passwordMismatch });
      return;
    }
    startTransition(async () => {
      const res = await changeMyPassword({
        locale,
        current_password: String(fd.get("current_password") ?? ""),
        new_password: newPwd,
      });
      if (res.ok) {
        (e.target as HTMLFormElement).reset();
        onSuccess?.();
        onOpenChange(false);
        return;
      }
      setBanner({ tone: "err", text: mapPwdError(res.errorKey, labels) });
    });
  }

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      descriptionId={descId}
      title={labels.passwordSectionTitle}
      stackClassName="z-[250]"
      disableClose={pending}
    >
      <p id={descId} className="text-sm text-[var(--color-muted-foreground)]">
        {labels.passwordSectionLead}
      </p>
      <form className="space-y-4" onSubmit={onSubmit} autoComplete="off">
        <div>
          <Label htmlFor="mpw-cur">{labels.currentPassword}</Label>
          <input
            id="mpw-cur"
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="mpw-new">{labels.newPassword}</Label>
          <input
            id="mpw-new"
            name="new_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="mpw-confirm">{labels.confirmPassword}</Label>
          <input
            id="mpw-confirm"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" disabled={pending} onClick={() => onOpenChange(false)}>
            {labels.passwordModalCancel}
          </Button>
          <Button type="submit" disabled={pending} isLoading={pending} className="min-h-[44px]">
            {labels.changePassword}
          </Button>
        </div>
        {banner?.tone === "err" ? (
          <p role="alert" className="text-sm text-[var(--color-error)]">
            {banner.text}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}

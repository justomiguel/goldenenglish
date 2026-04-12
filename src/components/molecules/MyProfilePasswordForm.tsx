"use client";

import { type FormEvent, useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import {
  changeMyPassword,
  type MyProfileActionErrorKey,
} from "@/app/[locale]/dashboard/profile/actions";

export interface MyProfilePasswordFormProps {
  locale: string;
  labels: Dictionary["dashboard"]["myProfile"];
}

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

export function MyProfilePasswordForm({ locale, labels }: MyProfilePasswordFormProps) {
  const [pending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

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
        setBanner({ tone: "ok", text: labels.passwordSuccess });
        return;
      }
      setBanner({ tone: "err", text: mapPwdError(res.errorKey, labels) });
    });
  }

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-2 font-display text-xl font-semibold text-[var(--color-secondary)]">
        {labels.passwordSectionTitle}
      </h2>
      <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">{labels.passwordSectionLead}</p>
      <form className="space-y-4" onSubmit={onSubmit} autoComplete="off">
        <div>
          <Label htmlFor="mp-cur-pw">{labels.currentPassword}</Label>
          <input
            id="mp-cur-pw"
            name="current_password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="mp-new-pw">{labels.newPassword}</Label>
          <input
            id="mp-new-pw"
            name="new_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        <div>
          <Label htmlFor="mp-confirm-pw">{labels.confirmPassword}</Label>
          <input
            id="mp-confirm-pw"
            name="confirm_password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" disabled={pending} isLoading={pending} className="min-h-[44px]">
          {labels.changePassword}
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
  );
}

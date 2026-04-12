"use client";

import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import type { ProfileAvatarFormLabels } from "@/components/molecules/ProfileAvatarPanel";
import { ProfileAvatarPanel } from "@/components/molecules/ProfileAvatarPanel";
import { MyProfilePersonalForm } from "@/components/molecules/MyProfilePersonalForm";
import { MyProfilePasswordForm } from "@/components/molecules/MyProfilePasswordForm";

export interface MyProfileScreenProps {
  locale: string;
  email: string;
  initial: {
    firstName: string;
    lastName: string;
    phone: string;
    dni: string;
    birthDate: string;
  };
  minorPersonalLocked: boolean;
  avatarDisplayUrl: string | null;
  displayName: string;
  labels: Dictionary["dashboard"]["myProfile"];
}

export function MyProfileScreen({
  locale,
  email,
  initial,
  minorPersonalLocked,
  avatarDisplayUrl,
  displayName,
  labels,
}: MyProfileScreenProps) {
  const avatarLabels: ProfileAvatarFormLabels = {
    avatarHint: labels.avatarHint,
    avatarChoose: labels.avatarChoose,
    avatarUpload: labels.avatarUpload,
    avatarSuccess: labels.avatarSuccess,
    avatarError: labels.avatarError,
    avatarTooBig: labels.avatarTooBig,
    avatarInvalidType: labels.avatarInvalidType,
    avatarForbidden: labels.avatarForbidden,
    avatarNoFile: labels.avatarNoFile,
  };

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-6">
        <Label htmlFor="mp-email-ro">{labels.emailLabel}</Label>
        <p id="mp-email-ro" className="mt-2 break-all text-sm font-medium text-[var(--color-foreground)]">
          {email}
        </p>
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">{labels.emailHint}</p>
      </div>

      <MyProfilePersonalForm
        locale={locale}
        minorPersonalLocked={minorPersonalLocked}
        initial={initial}
        labels={labels}
      />

      <MyProfilePasswordForm locale={locale} labels={labels} />

      <div>
        <h2 className="mb-4 font-display text-xl font-semibold text-[var(--color-secondary)]">
          {labels.photoSectionTitle}
        </h2>
        <ProfileAvatarPanel
          locale={locale}
          avatarDisplayUrl={avatarDisplayUrl}
          displayName={displayName}
          labels={avatarLabels}
        />
      </div>
    </div>
  );
}

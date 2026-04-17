"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import { ProfileAvatarChangeFab } from "@/components/molecules/ProfileAvatarChangeFab";
import { MyProfilePersonalForm } from "@/components/molecules/MyProfilePersonalForm";
import { MyProfileChangePasswordModal } from "@/components/molecules/MyProfileChangePasswordModal";
import { ClassReminderPrefsSection } from "@/components/molecules/ClassReminderPrefsSection";

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
  classReminder?: {
    studentId: string;
    initial: Record<string, unknown> | null;
    studentLabels: Dictionary["dashboard"]["student"];
  } | null;
}

export function MyProfileScreen({
  locale,
  email,
  initial,
  minorPersonalLocked,
  avatarDisplayUrl,
  displayName,
  labels,
  classReminder = null,
}: MyProfileScreenProps) {
  const router = useRouter();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const avatarFabLabels = useMemo(
    () => ({
      avatarFabAria: labels.avatarFabAria,
      avatarFabTooltip: labels.avatarFabTooltip,
      avatarMenuTakePhoto: labels.avatarMenuTakePhoto,
      avatarMenuUpload: labels.avatarMenuUpload,
      avatarHint: labels.avatarHint,
      avatarSuccess: labels.avatarSuccess,
      avatarError: labels.avatarError,
      avatarTooBig: labels.avatarTooBig,
      avatarInvalidType: labels.avatarInvalidType,
      avatarSessionMissing: labels.avatarSessionMissing,
      avatarProfileMissing: labels.avatarProfileMissing,
      avatarNoFile: labels.avatarNoFile,
      avatarWebcamTitle: labels.avatarWebcamTitle,
      avatarWebcamLead: labels.avatarWebcamLead,
      avatarWebcamCapture: labels.avatarWebcamCapture,
      avatarWebcamCancel: labels.avatarWebcamCancel,
      avatarWebcamPermissionDenied: labels.avatarWebcamPermissionDenied,
      avatarWebcamOpenFailed: labels.avatarWebcamOpenFailed,
    }),
    [labels],
  );

  return (
    <div className="mx-auto w-full max-w-3xl md:max-w-[48rem]">
      <div className="overflow-hidden rounded-xl border border-[color-mix(in_srgb,var(--color-accent)_24%,var(--color-border))] bg-[var(--color-surface)] shadow-[var(--shadow-card)] ring-1 ring-[color-mix(in_srgb,var(--color-accent)_22%,transparent)]">
        <div className="dashboard-profile-cover h-28 sm:h-32 md:h-36" aria-hidden />

        <div className="relative px-4 pb-8 pt-0 sm:px-8">
          <div className="-mt-[4.75rem] inline-block sm:-mt-20">
            <ProfileAvatarChangeFab
              locale={locale}
              displayName={displayName}
              avatarDisplayUrl={avatarDisplayUrl}
              labels={avatarFabLabels}
            />
          </div>

          <div className="mt-3 max-w-2xl">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--color-primary)] sm:text-[1.75rem]">
              {displayName}
            </h1>
            <span
              className="mt-2 block h-1 w-12 rounded-full bg-[var(--color-accent)]"
              aria-hidden
            />
            <div className="mt-4">
              <div className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--color-accent)]" aria-hidden strokeWidth={2} />
                <Label htmlFor="mp-email-ro" className="text-xs font-medium text-[var(--color-muted-foreground)]">
                  {labels.emailLabel}
                </Label>
              </div>
              <p
                id="mp-email-ro"
                className="mt-1 break-all text-sm font-semibold text-[var(--color-primary)] sm:text-base"
              >
                {email}
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.emailHint}</p>
            </div>
            <p className="mt-5 max-w-prose text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {labels.lead}
            </p>
          </div>

          <section className="mt-8 border-t border-[color-mix(in_srgb,var(--color-accent)_20%,var(--color-border))] pt-8">
            <MyProfilePersonalForm
              locale={locale}
              minorPersonalLocked={minorPersonalLocked}
              initial={initial}
              labels={labels}
              layout="inset"
            />
            {classReminder ? (
              <ClassReminderPrefsSection
                locale={locale}
                studentId={classReminder.studentId}
                initial={classReminder.initial as never}
                labels={classReminder.studentLabels}
              />
            ) : null}
            <div className="mt-8 border-t border-[color-mix(in_srgb,var(--color-accent)_20%,var(--color-border))] pt-6">
              <p className="max-w-prose text-sm text-[var(--color-muted-foreground)]">{labels.passwordSectionLead}</p>
              <Button
                type="button"
                variant="secondary"
                className="mt-4 min-h-[44px]"
                onClick={() => setPasswordModalOpen(true)}
              >
                {labels.passwordModalTrigger}
              </Button>
            </div>
          </section>

          <MyProfileChangePasswordModal
            open={passwordModalOpen}
            onOpenChange={setPasswordModalOpen}
            locale={locale}
            labels={labels}
            onSuccess={() => router.refresh()}
          />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, KeyRound, Mail } from "lucide-react";
import type { AppSurface } from "@/hooks/useAppSurface";
import { ProfileAvatarChangeFab } from "@/components/molecules/ProfileAvatarChangeFab";
import { MyProfilePersonalForm } from "@/components/molecules/MyProfilePersonalForm";
import { MyProfileChangePasswordModal } from "@/components/molecules/MyProfileChangePasswordModal";
import { ClassReminderPrefsSection } from "@/components/molecules/ClassReminderPrefsSection";
import { TutorFinancialAccessSection } from "@/components/molecules/TutorFinancialAccessSection";
import { PwaGroupedSection } from "@/components/pwa/molecules/PwaGroupedSection";
import type { MyProfileScreenProps } from "@/components/organisms/MyProfileScreen";

export interface MyProfilePwaScreenProps extends MyProfileScreenProps {
  surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">;
  backHref: string;
}

export function MyProfilePwaScreen({
  surface,
  backHref,
  locale,
  email,
  initial,
  minorPersonalLocked,
  avatarDisplayUrl,
  displayName,
  labels,
  fileUploadProgress,
  classReminder = null,
  tutorFinancialAccess = null,
}: MyProfilePwaScreenProps) {
  const router = useRouter();
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const standalone = surface === "pwa-mobile";

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
    <div className="flex min-h-dvh flex-col bg-[var(--color-muted)]">
      <header
        className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md"
        style={{ paddingTop: standalone ? "max(0.35rem, env(safe-area-inset-top, 0px))" : "max(0.25rem, env(safe-area-inset-top, 0px))" }}
      >
        <div className="mx-auto grid max-w-[var(--layout-max-width)] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-3 py-2.5">
          <Link
            href={backHref}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-start gap-1 rounded-full px-2 text-[var(--color-primary)] active:bg-[var(--color-muted)]"
          >
            <ChevronLeft className="h-6 w-6 shrink-0" aria-hidden strokeWidth={2.25} />
            <span className="sr-only">{labels.backToDashboard}</span>
          </Link>
          <h1 className="truncate text-center font-display text-base font-bold text-[var(--color-foreground)]">
            {labels.title}
          </h1>
          <div className="min-w-[44px]" aria-hidden />
        </div>
      </header>

      <div
        className="mx-auto w-full max-w-[var(--layout-max-width)] flex-1 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
        aria-labelledby="dashboard-profile-pwa-title"
      >
        <section className="flex flex-col items-center bg-[var(--color-surface)] px-4 pb-6 pt-8 text-center">
          <ProfileAvatarChangeFab
            locale={locale}
            displayName={displayName}
            avatarDisplayUrl={avatarDisplayUrl}
            labels={avatarFabLabels}
            fileUploadProgress={fileUploadProgress}
          />
          <h2 id="dashboard-profile-pwa-title" className="mt-5 font-display text-xl font-bold text-[var(--color-foreground)]">
            {displayName}
          </h2>
          <p className="mt-1 flex items-center justify-center gap-1.5 break-all text-sm text-[var(--color-muted-foreground)]">
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {email}
          </p>
          <p className="mt-3 max-w-sm text-xs leading-relaxed text-[var(--color-muted-foreground)]">{labels.lead}</p>
        </section>

        <MyProfilePersonalForm
          locale={locale}
          minorPersonalLocked={minorPersonalLocked}
          initial={initial}
          labels={labels}
          layout="pwa"
        />

        {classReminder ? (
          <PwaGroupedSection
            title={classReminder.studentLabels.classReminderPrefsTitle}
            footer={classReminder.studentLabels.classReminderPrefsHint}
            className="pt-1"
          >
            <ClassReminderPrefsSection
              locale={locale}
              studentId={classReminder.studentId}
              initial={classReminder.initial as never}
              labels={classReminder.studentLabels}
              omitHeader
              variant="pwa"
            />
          </PwaGroupedSection>
        ) : null}

        {tutorFinancialAccess ? (
          <PwaGroupedSection
            title={labels.tutorAccessSectionTitle}
            footer={labels.tutorAccessSectionLead}
            className="pt-1"
          >
            <TutorFinancialAccessSection
              locale={locale}
              tutors={tutorFinancialAccess}
              labels={labels}
              variant="pwa"
            />
          </PwaGroupedSection>
        ) : null}

        <PwaGroupedSection title={labels.passwordSectionTitle} footer={labels.passwordSectionLead} className="pt-1">
          <button
            type="button"
            className="flex min-h-[52px] w-full items-center justify-between gap-3 px-4 py-3 text-left active:bg-[var(--color-muted)]/60"
            onClick={() => setPasswordModalOpen(true)}
          >
            <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-[var(--color-foreground)]">
              <KeyRound className="h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden />
              {labels.passwordModalTrigger}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" aria-hidden />
          </button>
        </PwaGroupedSection>
      </div>

      <MyProfileChangePasswordModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        locale={locale}
        labels={labels}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}

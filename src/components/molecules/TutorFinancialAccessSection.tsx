"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { setTutorFinancialAccess } from "@/app/[locale]/dashboard/profile/tutorFinancialAccessActions";
import type { Dictionary } from "@/types/i18n";

type Labels = Dictionary["dashboard"]["myProfile"];

export interface TutorFinancialAccessRow {
  tutorId: string;
  displayName: string;
  financialAccessActive: boolean;
}

export interface TutorFinancialAccessSectionProps {
  locale: string;
  tutors: TutorFinancialAccessRow[];
  labels: Labels;
}

/**
 * Sección "Acceso de tu tutor a tus pagos" en el perfil del alumno mayor.
 * Sólo se monta cuando el alumno NO es menor y tiene tutores enlazados.
 * Cada fila dispara `setTutorFinancialAccess` con `intent: revoke|restore`.
 */
export function TutorFinancialAccessSection({
  locale,
  tutors,
  labels,
}: TutorFinancialAccessSectionProps) {
  const router = useRouter();
  const [pendingTutor, setPendingTutor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tutorId: string; message: string } | null>(null);
  const [, startTransition] = useTransition();

  async function onToggle(tutor: TutorFinancialAccessRow) {
    const intent = tutor.financialAccessActive ? "revoke" : "restore";
    setPendingTutor(tutor.tutorId);
    setFeedback(null);

    const formData = new FormData();
    formData.set("locale", locale);
    formData.set("tutorId", tutor.tutorId);
    formData.set("intent", intent);

    const result = await setTutorFinancialAccess(formData);
    setPendingTutor(null);
    if (result.ok) {
      setFeedback({ tutorId: tutor.tutorId, message: labels.tutorAccessUpdated });
      startTransition(() => router.refresh());
    } else {
      setFeedback({
        tutorId: tutor.tutorId,
        message: `${labels.tutorAccessError} ${result.message ?? ""}`.trim(),
      });
    }
  }

  return (
    <section
      className="mt-8 border-t border-[color-mix(in_srgb,var(--color-accent)_20%,var(--color-border))] pt-6"
      aria-labelledby="tutor-access-section-title"
    >
      <h2
        id="tutor-access-section-title"
        className="font-display text-lg font-semibold text-[var(--color-secondary)]"
      >
        {labels.tutorAccessSectionTitle}
      </h2>
      <p className="mt-2 max-w-prose text-sm text-[var(--color-muted-foreground)]">
        {labels.tutorAccessSectionLead}
      </p>

      {tutors.length === 0 ? (
        <p
          className="mt-4 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]"
          role="status"
        >
          {labels.tutorAccessNoTutors}
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {tutors.map((tutor) => {
            const isActive = tutor.financialAccessActive;
            const isPending = pendingTutor === tutor.tutorId;
            return (
              <li
                key={tutor.tutorId}
                className="flex flex-col gap-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {tutor.displayName}
                  </p>
                  <p
                    className={
                      isActive
                        ? "mt-1 text-xs text-[var(--color-success)]"
                        : "mt-1 text-xs text-[var(--color-muted-foreground)]"
                    }
                  >
                    {isActive ? labels.tutorAccessActive : labels.tutorAccessRevoked}
                  </p>
                  {feedback?.tutorId === tutor.tutorId ? (
                    <p
                      className="mt-1 text-xs text-[var(--color-muted-foreground)]"
                      aria-live="polite"
                    >
                      {feedback.message}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant={isActive ? "secondary" : "primary"}
                  className="min-h-[44px] sm:w-auto"
                  onClick={() => onToggle(tutor)}
                  disabled={isPending}
                  isLoading={isPending}
                >
                  {!isPending ? (
                    isActive ? (
                      <ShieldOff className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                    )
                  ) : null}
                  {isPending
                    ? labels.tutorAccessUpdating
                    : isActive
                      ? labels.tutorAccessRevoke
                      : labels.tutorAccessRestore}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

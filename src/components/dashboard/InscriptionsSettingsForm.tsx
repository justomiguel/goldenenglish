"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  setInscriptionsEnabled,
  setRegistrationCohortAction,
} from "@/app/[locale]/dashboard/admin/settings/actions";
import { setRegisterSectionMode } from "@/app/[locale]/dashboard/admin/settings/setRegisterSectionMode";
import { Label } from "@/components/atoms/Label";
import type { RegistrationCohortConfig } from "@/lib/settings/inscriptionsServer";
import {
  REGISTER_SECTION_MODES,
  type RegisterSectionMode,
} from "@/lib/settings/registerSectionMode";
import type { Dictionary } from "@/types/i18n";

interface InscriptionsSettingsFormProps {
  locale: string;
  initialEnabled: boolean;
  initialSectionMode?: RegisterSectionMode;
  labels: Dictionary["admin"]["settings"];
  cohortConfig?: RegistrationCohortConfig;
}

export function InscriptionsSettingsForm({
  locale,
  initialEnabled,
  initialSectionMode = "first_open",
  labels,
  cohortConfig,
}: InscriptionsSettingsFormProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [sectionMode, setSectionMode] = useState<RegisterSectionMode>(initialSectionMode);
  const [selectedCohortId, setSelectedCohortId] = useState<string>(
    cohortConfig?.configuredCohortId ?? "",
  );
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function onToggle(next: boolean) {
    setMsg(null);
    const res = await setInscriptionsEnabled(locale, next);
    if (res.ok) {
      setEnabled(next);
      setMsg(labels.saved);
      router.refresh();
    } else {
      setMsg(labels.error);
    }
  }

  async function onSectionMode(next: RegisterSectionMode) {
    setMsg(null);
    const res = await setRegisterSectionMode(locale, next);
    if (res.ok) {
      setSectionMode(next);
      setMsg(labels.saved);
      router.refresh();
    } else {
      setMsg(labels.error);
    }
  }

  const modeCopy: Record<RegisterSectionMode, { label: string; hint: string }> = {
    student_choice: {
      label: labels.registerSectionModeStudent,
      hint: labels.registerSectionModeStudentHint,
    },
    first_open: {
      label: labels.registerSectionModeFirstOpen,
      hint: labels.registerSectionModeFirstOpenHint,
    },
    admin_assign: {
      label: labels.registerSectionModeAdmin,
      hint: labels.registerSectionModeAdminHint,
    },
  };

  async function onCohortChange(nextCohortId: string) {
    setMsg(null);
    const normalized = nextCohortId.trim() ? nextCohortId.trim() : null;
    const res = await setRegistrationCohortAction(locale, normalized);
    if (res.ok) {
      setSelectedCohortId(nextCohortId);
      setMsg(labels.saved);
      router.refresh();
    } else {
      setMsg(labels.error);
    }
  }

  const currentCohortName = cohortConfig?.currentCohort?.name ?? "—";
  const activeCohort =
    (selectedCohortId
      ? cohortConfig?.cohorts.find((c) => c.id === selectedCohortId)
      : cohortConfig?.currentCohort) ??
    cohortConfig?.activeCohort ??
    null;
  const activeCohortName = activeCohort?.name ?? currentCohortName;

  return (
    <div className="max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-soft)]">
      <h2 className="text-lg font-semibold text-[var(--color-primary)]">
        {labels.title}
      </h2>
      <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
        {labels.inscriptionsHint}
      </p>
      <label
        className="mt-6 flex cursor-pointer items-center gap-3"
        title={labels.inscriptionsToggleTooltip}
      >
        <input
          type="checkbox"
          className="h-5 w-5 rounded border-[var(--color-border)]"
          checked={enabled}
          onChange={(e) => void onToggle(e.target.checked)}
        />
        <span className="font-medium text-[var(--color-foreground)]">
          {labels.inscriptions}
        </span>
      </label>
      <fieldset className="mt-4 space-y-3">
        <legend className="font-medium text-[var(--color-foreground)]">
          {labels.registerSectionModeLabel}
        </legend>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {labels.registerSectionModeHint}
        </p>
        {REGISTER_SECTION_MODES.map((value) => (
          <label key={value} className="flex cursor-pointer items-start gap-3">
            <input
              type="radio"
              name="register-section-mode"
              className="mt-1 h-4 w-4 border-[var(--color-border)]"
              checked={sectionMode === value}
              onChange={() => void onSectionMode(value)}
            />
            <span>
              <span className="block font-medium text-[var(--color-foreground)]">
                {modeCopy[value].label}
              </span>
              <span className="mt-1 block text-xs text-[var(--color-muted-foreground)]">
                {modeCopy[value].hint}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {cohortConfig && cohortConfig.cohorts.length > 0 ? (
        <div className="mt-6 space-y-3 border-t border-[var(--color-border)] pt-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-[var(--color-muted)] px-2.5 py-1 font-medium text-[var(--color-foreground)]">
              {labels.registrationCohortCurrentBadge.replace("{name}", currentCohortName)}
            </span>
            <span className="rounded-full bg-[var(--color-primary)]/15 px-2.5 py-1 font-semibold text-[var(--color-primary)]">
              {labels.registrationCohortActiveBadge.replace("{name}", activeCohortName)}
            </span>
          </div>
          <div>
            <Label htmlFor="settings-registration-cohort">
              {labels.registrationCohortLabel}
            </Label>
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {labels.registrationCohortHint}
            </p>
            <select
              id="settings-registration-cohort"
              value={selectedCohortId}
              onChange={(e) => void onCohortChange(e.target.value)}
              className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            >
              <option value="">
                {labels.registrationCohortFollowCurrent.replace("{name}", currentCohortName)}
              </option>
              {cohortConfig.cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {msg ? (
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{msg}</p>
      ) : null}
    </div>
  );
}

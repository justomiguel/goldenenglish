"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/atoms/Button";
import { RegisterSectionPicker } from "@/components/register/RegisterSectionPicker";
import { submitTrialRescheduleAction } from "@/app/[locale]/register/trialRescheduleActions";
import type { Dictionary } from "@/types/i18n";
import type { RegistrationSectionPickerOption } from "@/lib/register/registrationSectionPicker";

export function TrialRescheduleForm({
  locale,
  token,
  dict,
  sectionOptions,
}: {
  locale: string;
  token: string;
  dict: Dictionary["register"];
  sectionOptions: Array<{ id: string; label: string } & Partial<RegistrationSectionPickerOption>>;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  return (
    <section className="mx-auto w-full max-w-6xl space-y-4 px-4 py-10">
      <h1 className="text-2xl font-semibold">{dict.trial.rescheduleTitle}</h1>
      <p className="text-sm text-[var(--color-muted-foreground)]">{dict.trial.rescheduleLead}</p>
      {done ? (
        <p role="status">{dict.trial.rescheduleOk}</p>
      ) : (
        <>
          <RegisterSectionPicker
            dict={dict}
            options={sectionOptions}
            intent="trial"
            selectedIds={selectedIds}
            onChange={setSelectedIds}
          />
          <Button
            type="button"
            disabled={pending || selectedIds.length === 0}
            onClick={() => {
              setMessage(null);
              start(async () => {
                const result = await submitTrialRescheduleAction({
                  locale,
                  token,
                  sectionIds: selectedIds,
                });
                if (!result.ok) {
                  setMessage(result.message);
                  return;
                }
                setDone(true);
              });
            }}
          >
            {dict.trial.rescheduleSubmit}
          </Button>
        </>
      )}
      {message ? <p className="text-sm text-red-700">{message}</p> : null}
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import { Modal } from "@/components/atoms/Modal";
import { RegisterForm } from "@/components/register/RegisterForm";
import type { RegistrationSectionPickerOption } from "@/lib/register/registrationSectionPicker";
import type { RegistrationExtrasPackId } from "@/lib/register/packs/extrasPackForTemplateKind";
import type { RegistrationCohortOption } from "@/lib/settings/inscriptionsServer";
import type { Dictionary } from "@/types/i18n";

type SectionOptionItem = { id: string; label: string } & Partial<RegistrationSectionPickerOption>;

interface AdminRegistrationCreateButtonProps {
  locale: string;
  labels: Dictionary["admin"]["registrations"];
  registerDict: Dictionary["register"];
  legalAgeMajority: number;
  sectionOptions: SectionOptionItem[];
  extrasPack: RegistrationExtrasPackId | null;
  cohorts?: RegistrationCohortOption[];
  defaultCohortId?: string | null;
  sectionOptionsByCohort?: Record<string, SectionOptionItem[]>;
}

export function AdminRegistrationCreateButton({
  locale,
  labels,
  registerDict,
  legalAgeMajority,
  sectionOptions,
  extrasPack,
  cohorts = [],
  defaultCohortId = null,
  sectionOptionsByCohort,
}: AdminRegistrationCreateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const initialCohortId =
    defaultCohortId ?? cohorts.find((c) => c.isCurrent)?.id ?? cohorts[0]?.id ?? "";
  const [selectedCohortId, setSelectedCohortId] = useState<string>(initialCohortId);

  function close() {
    setOpen(false);
    setFormKey((n) => n + 1);
  }

  const effectiveSectionOptions =
    selectedCohortId && sectionOptionsByCohort && sectionOptionsByCohort[selectedCohortId]
      ? sectionOptionsByCohort[selectedCohortId]
      : sectionOptions;

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        className="min-h-11 px-4"
        onClick={() => {
          setNotice(null);
          setSelectedCohortId(initialCohortId);
          setOpen(true);
        }}
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        {labels.createCta}
      </Button>
      {notice ? (
        <p className="text-sm text-[var(--color-foreground)]" role="status">
          {notice}
        </p>
      ) : null}
      <Modal
        open={open}
        onOpenChange={(next) => {
          if (!next) close();
        }}
        titleId="reg-create-title"
        descriptionId="reg-create-desc"
        title={labels.createTitle}
        dialogClassName="sm:max-w-2xl"
      >
        <p id="reg-create-desc" className="text-sm text-[var(--color-muted-foreground)]">
          {labels.createLead}
        </p>
        {cohorts.length > 0 ? (
          <div className="mt-3 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-3">
            <Label htmlFor="admin-reg-create-cohort">{labels.createCohortLabel}</Label>
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {labels.createCohortHint}
            </p>
            <select
              id="admin-reg-create-cohort"
              value={selectedCohortId}
              onChange={(e) => setSelectedCohortId(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]"
            >
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>
                  {cohort.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <RegisterForm
          key={`${formKey}-${selectedCohortId}`}
          locale={locale}
          dict={registerDict}
          legalAgeMajority={legalAgeMajority}
          sectionOptions={effectiveSectionOptions}
          extrasPack={extrasPack}
          showAllSections
          embedded
          onRegistered={() => {
            setNotice(labels.createSuccess);
            router.refresh();
          }}
          onLeave={close}
        />
      </Modal>
    </div>
  );
}

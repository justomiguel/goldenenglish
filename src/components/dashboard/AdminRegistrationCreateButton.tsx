"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { RegisterForm } from "@/components/register/RegisterForm";
import type { RegistrationSectionPickerOption } from "@/lib/register/registrationSectionPicker";
import type { RegistrationExtrasPackId } from "@/lib/register/packs/extrasPackForTemplateKind";
import type { Dictionary } from "@/types/i18n";

interface AdminRegistrationCreateButtonProps {
  locale: string;
  labels: Dictionary["admin"]["registrations"];
  registerDict: Dictionary["register"];
  legalAgeMajority: number;
  sectionOptions: Array<{ id: string; label: string } & Partial<RegistrationSectionPickerOption>>;
  extrasPack: RegistrationExtrasPackId | null;
}

export function AdminRegistrationCreateButton({
  locale,
  labels,
  registerDict,
  legalAgeMajority,
  sectionOptions,
  extrasPack,
}: AdminRegistrationCreateButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setFormKey((n) => n + 1);
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        type="button"
        className="min-h-11 px-4"
        onClick={() => {
          setNotice(null);
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
        <RegisterForm
          key={formKey}
          locale={locale}
          dict={registerDict}
          legalAgeMajority={legalAgeMajority}
          sectionOptions={sectionOptions}
          extrasPack={extrasPack}
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

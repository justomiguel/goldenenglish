"use client";

import { type FormEvent, useState } from "react";
import {
  updateRegistrationDraft,
  type RegistrationDraftPayload,
} from "@/app/[locale]/dashboard/admin/registrations/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";
import { isRegistrationUndecidedStored } from "@/lib/register/registrationSectionConstants";

export interface AdminRegistrationEditFormProps {
  locale: string;
  row: AdminRegistrationRow;
  busy: boolean;
  onBusy: (id: string | null) => void;
  onClose: () => void;
  onSuccess: () => void;
  labels: Dictionary["admin"]["registrations"];
}

export function AdminRegistrationEditForm({
  locale,
  row,
  busy,
  onBusy,
  onClose,
  onSuccess,
  labels,
}: AdminRegistrationEditFormProps) {
  const [firstName, setFirstName] = useState(row.first_name);
  const [lastName, setLastName] = useState(row.last_name);
  const [dni, setDni] = useState(row.dni);
  const [email, setEmail] = useState(row.email);
  const [phone, setPhone] = useState(row.phone ?? "");
  const [birth, setBirth] = useState(row.birth_date?.slice(0, 10) ?? "");
  const [level, setLevel] = useState(() => {
    const raw = row.level_interest?.trim() ?? "";
    if (isRegistrationUndecidedStored(raw)) return "";
    return raw.toUpperCase();
  });
  const [tutorName, setTutorName] = useState(row.tutor_name ?? "");
  const [tutorDni, setTutorDni] = useState(row.tutor_dni ?? "");
  const [tutorEmail, setTutorEmail] = useState(row.tutor_email ?? "");
  const [tutorPhone, setTutorPhone] = useState(row.tutor_phone ?? "");
  const [tutorRel, setTutorRel] = useState(row.tutor_relationship ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    onBusy(row.id);
    setFormError(null);
    const payload: RegistrationDraftPayload = {
      registration_id: row.id,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      dni: dni.trim(),
      email: email.trim(),
      phone: phone.trim(),
      birth_date: birth.trim(),
      level_interest: level.trim().toUpperCase() as RegistrationDraftPayload["level_interest"],
      tutor_name: tutorName.trim(),
      tutor_dni: tutorDni.trim(),
      tutor_email: tutorEmail.trim(),
      tutor_phone: tutorPhone.trim(),
      tutor_relationship: tutorRel.trim(),
    };
    const res = await updateRegistrationDraft(locale, payload);
    onBusy(null);
    if (res.ok) {
      onClose();
      onSuccess();
      return;
    }
    setFormError(res.message ?? labels.editError);
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mt-4 max-h-[min(70vh,520px)] space-y-3 overflow-y-auto pr-1">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="ed-fn">{labels.editFirstName}</Label>
          <Input
            id="ed-fn"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 w-full"
            autoComplete="given-name"
          />
        </div>
        <div>
          <Label htmlFor="ed-ln">{labels.editLastName}</Label>
          <Input
            id="ed-ln"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 w-full"
            autoComplete="family-name"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="ed-dni">{labels.dni}</Label>
        <Input id="ed-dni" value={dni} onChange={(e) => setDni(e.target.value)} className="mt-1 w-full" />
      </div>
      <div>
        <Label htmlFor="ed-em">{labels.email}</Label>
        <Input
          id="ed-em"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full"
          autoComplete="email"
        />
      </div>
      <div>
        <Label htmlFor="ed-ph">{labels.phone}</Label>
        <Input id="ed-ph" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full" />
      </div>
      <div>
        <Label htmlFor="ed-bd">{labels.birthDate}</Label>
        <Input id="ed-bd" type="date" value={birth} onChange={(e) => setBirth(e.target.value)} className="mt-1 w-full" />
      </div>
      <div>
        <Label htmlFor="ed-lv">{labels.level}</Label>
        <Input
          id="ed-lv"
          value={level}
          onChange={(e) => setLevel(e.target.value.toUpperCase())}
          className="mt-1 w-full"
          placeholder={labels.editLevelPlaceholder}
          maxLength={2}
        />
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.editLevelHint}</p>
      </div>
      <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/20 p-3">
        <p className="text-sm font-semibold text-[var(--color-secondary)]">{labels.tutorOnRequestTitle}</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="ed-tn">{labels.tutorOnRequestName}</Label>
            <Input id="ed-tn" value={tutorName} onChange={(e) => setTutorName(e.target.value)} className="mt-1 w-full" />
          </div>
          <div>
            <Label htmlFor="ed-td">{labels.tutorOnRequestDni}</Label>
            <Input id="ed-td" value={tutorDni} onChange={(e) => setTutorDni(e.target.value)} className="mt-1 w-full" />
          </div>
          <div>
            <Label htmlFor="ed-te">{labels.tutorOnRequestEmail}</Label>
            <Input
              id="ed-te"
              type="email"
              value={tutorEmail}
              onChange={(e) => setTutorEmail(e.target.value)}
              className="mt-1 w-full"
            />
          </div>
          <div>
            <Label htmlFor="ed-tp">{labels.editTutorPhone}</Label>
            <Input id="ed-tp" value={tutorPhone} onChange={(e) => setTutorPhone(e.target.value)} className="mt-1 w-full" />
          </div>
          <div>
            <Label htmlFor="ed-tr">{labels.tutorOnRequestRelationship}</Label>
            <Input id="ed-tr" value={tutorRel} onChange={(e) => setTutorRel(e.target.value)} className="mt-1 w-full" />
          </div>
        </div>
      </div>
      {formError ? (
        <p className="text-sm text-[var(--color-error)]" role="alert">
          {formError}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" className="min-h-[44px] px-4" onClick={onClose}>
          {labels.cancel}
        </Button>
        <Button type="submit" className="min-h-[44px] px-4" disabled={busy}>
          {labels.editSave}
        </Button>
      </div>
    </form>
  );
}

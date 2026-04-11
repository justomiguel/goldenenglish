"use client";

import { type FormEvent, useState } from "react";
import { acceptRegistration } from "@/app/[locale]/dashboard/admin/registrations/actions";
import { Button } from "@/components/atoms/Button";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import type { AdminRegistrationRow } from "@/types/adminRegistration";
import type { Dictionary } from "@/types/i18n";

export interface AdminRegistrationAcceptFormProps {
  locale: string;
  row: AdminRegistrationRow;
  busy: boolean;
  onBusy: (id: string | null) => void;
  onClose: () => void;
  onSuccess: () => void;
  labels: Dictionary["admin"]["registrations"];
  userLabels: Pick<Dictionary["admin"]["users"], "password" | "passwordHint">;
}

/**
 * Mount with key={row.id} from the parent so password/birth reset when switching rows
 * without syncing state in an effect.
 */
export function AdminRegistrationAcceptForm({
  locale,
  row,
  busy,
  onBusy,
  onClose,
  onSuccess,
  labels,
  userLabels,
}: AdminRegistrationAcceptFormProps) {
  const [password, setPassword] = useState("");
  const [birth, setBirth] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    onBusy(row.id);
    setFormError(null);
    const res = await acceptRegistration(locale, {
      registration_id: row.id,
      password: password.trim() || undefined,
      birth_date: birth.trim() || undefined,
    });
    onBusy(null);
    if (res.ok) {
      onClose();
      onSuccess();
      return;
    }
    if (res.message === "already_processed") {
      setFormError(labels.alreadyProcessed);
      return;
    }
    setFormError(`${labels.acceptError}: ${res.message ?? ""}`);
  }

  return (
    <>
      <dl className="grid gap-1 text-sm">
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.name}</dt>
          <dd className="font-medium">
            {row.first_name} {row.last_name}
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.email}</dt>
          <dd>{row.email}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-muted-foreground)]">{labels.dni}</dt>
          <dd>{row.dni}</dd>
        </div>
      </dl>
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
        <div>
          <Label htmlFor="acc-pass">{userLabels.password}</Label>
          <Input
            id="acc-pass"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full"
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {userLabels.passwordHint}
          </p>
        </div>
        <div>
          <Label htmlFor="acc-bd">{labels.birthDate}</Label>
          <Input
            id="acc-bd"
            type="date"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            className="mt-1 w-full"
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
            {labels.birthDateHint}
          </p>
        </div>
        {formError ? (
          <p className="text-sm text-[var(--color-error)]" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" className="min-h-[44px] px-4" onClick={onClose}>
            {labels.cancel}
          </Button>
          <Button type="submit" className="min-h-[44px] px-4" disabled={busy}>
            {labels.accept}
          </Button>
        </div>
      </form>
    </>
  );
}

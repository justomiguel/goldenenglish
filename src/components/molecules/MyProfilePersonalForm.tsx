"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import {
  updateMyProfile,
  type MyProfileActionErrorKey,
} from "@/app/[locale]/dashboard/profile/actions";

export interface MyProfilePersonalFormProps {
  locale: string;
  minorPersonalLocked: boolean;
  initial: {
    firstName: string;
    lastName: string;
    phone: string;
    dni: string;
    birthDate: string;
  };
  labels: Dictionary["dashboard"]["myProfile"];
}

function mapPersonalError(key: MyProfileActionErrorKey, labels: Dictionary["dashboard"]["myProfile"]) {
  switch (key) {
    case "minorLocked":
      return labels.personalErrorMinor;
    case "dniTaken":
      return labels.personalErrorDni;
    case "validation":
      return labels.personalErrorValidation;
    case "unauthorized":
    default:
      return labels.personalErrorGeneric;
  }
}

export function MyProfilePersonalForm({
  locale,
  minorPersonalLocked,
  initial,
  labels,
}: MyProfilePersonalFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      locale,
      first_name: String(fd.get("first_name") ?? ""),
      last_name: String(fd.get("last_name") ?? ""),
      dni_or_passport: String(fd.get("dni_or_passport") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      birth_date: String(fd.get("birth_date") ?? ""),
    };
    startTransition(async () => {
      const res = await updateMyProfile(payload);
      if (res.ok) {
        setBanner({ tone: "ok", text: labels.personalSuccess });
        router.refresh();
        return;
      }
      setBanner({ tone: "err", text: mapPersonalError(res.errorKey, labels) });
    });
  }

  const locked = minorPersonalLocked;

  return (
    <div className="rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-[var(--shadow-card)]">
      <h2 className="mb-2 font-display text-xl font-semibold text-[var(--color-secondary)]">
        {labels.personalDetailsTitle}
      </h2>
      <p className="mb-6 text-sm text-[var(--color-muted-foreground)]">{labels.personalDetailsLead}</p>
      {locked ? (
        <p
          role="status"
          className="mb-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3 py-2 text-sm text-[var(--color-muted-foreground)]"
        >
          {labels.minorNotice}
        </p>
      ) : null}
      <form className="space-y-4" onSubmit={onSubmit}>
        <div>
          <Label htmlFor="mp-first">{labels.firstName}</Label>
          <input
            id="mp-first"
            name="first_name"
            type="text"
            required
            disabled={locked}
            defaultValue={initial.firstName}
            autoComplete="given-name"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
        <div>
          <Label htmlFor="mp-last">{labels.lastName}</Label>
          <input
            id="mp-last"
            name="last_name"
            type="text"
            required
            disabled={locked}
            defaultValue={initial.lastName}
            autoComplete="family-name"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
        <div>
          <Label htmlFor="mp-phone">{labels.phone}</Label>
          <input
            id="mp-phone"
            name="phone"
            type="tel"
            disabled={locked}
            defaultValue={initial.phone}
            autoComplete="tel"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
        <div>
          <Label htmlFor="mp-dni">{labels.dni}</Label>
          <input
            id="mp-dni"
            name="dni_or_passport"
            type="text"
            required
            disabled={locked}
            defaultValue={initial.dni}
            autoComplete="off"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
        <div>
          <Label htmlFor="mp-birth">{labels.birthDate}</Label>
          <input
            id="mp-birth"
            name="birth_date"
            type="date"
            disabled={locked}
            defaultValue={initial.birthDate}
            autoComplete="bday"
            className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm disabled:opacity-60"
          />
        </div>
        <Button type="submit" disabled={pending || locked} isLoading={pending} className="min-h-[44px]">
          {labels.savePersonal}
        </Button>
        {banner ? (
          <p
            role="status"
            className={
              banner.tone === "ok"
                ? "text-sm text-[var(--color-primary)]"
                : "text-sm text-[var(--color-error)]"
            }
          >
            {banner.text}
          </p>
        ) : null}
      </form>
    </div>
  );
}

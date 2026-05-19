"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, UserPen } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import type { Dictionary } from "@/types/i18n";
import {
  updateMyProfile,
  type MyProfileActionErrorKey,
} from "@/app/[locale]/dashboard/profile/actions";
import { MyProfilePersonalFields } from "@/components/molecules/MyProfilePersonalFields";
import { PwaGroupedSection } from "@/components/pwa/molecules/PwaGroupedSection";

export type MyProfilePersonalFormLayout = "card" | "inset" | "pwa";

export interface MyProfilePersonalFormProps {
  locale: string;
  minorPersonalLocked: boolean;
  initial: {
    firstName: string;
    lastName: string;
    phone: string;
    dni: string;
    birthDate: string;
    homeAddressText: string;
    homePlaceId: string;
  };
  labels: Dictionary["dashboard"]["myProfile"];
  /** inset = section inside a parent shell; pwa = grouped native mobile sections. */
  layout?: MyProfilePersonalFormLayout;
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
  layout = "card",
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
      home_address_text: String(fd.get("home_address_text") ?? ""),
      home_place_id: String(fd.get("home_place_id") ?? ""),
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
  const inset = layout === "inset";
  const pwa = layout === "pwa";

  const lockedNotice = locked ? (
    <p
      role="status"
      className={
        pwa
          ? "border-b border-[var(--color-border)] bg-[var(--color-muted)]/30 px-4 py-3 text-sm text-[var(--color-muted-foreground)]"
          : "mb-6 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]/40 px-3 py-2 text-sm text-[var(--color-muted-foreground)]"
      }
    >
      {labels.minorNotice}
    </p>
  ) : null;

  const bannerNode = banner ? (
    <p
      role="status"
      className={
        pwa
          ? `px-4 py-2 text-sm ${banner.tone === "ok" ? "text-[var(--color-primary)]" : "text-[var(--color-error)]"}`
          : banner.tone === "ok"
            ? "text-sm text-[var(--color-primary)]"
            : "text-sm text-[var(--color-error)]"
      }
    >
      {banner.text}
    </p>
  ) : null;

  const saveButton = (
    <Button type="submit" disabled={pending || locked} isLoading={pending} className="min-h-[44px] w-full">
      {!pending ? <Save className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {labels.savePersonal}
    </Button>
  );

  if (pwa) {
    return (
      <PwaGroupedSection
        title={labels.personalDetailsTitle}
        footer={labels.personalDetailsLead}
        className="pt-1"
      >
        {lockedNotice}
        <form onSubmit={onSubmit}>
          <MyProfilePersonalFields locked={locked} initial={initial} labels={labels} layout="pwa" />
          <div className="border-t border-[var(--color-border)] px-4 py-3">{saveButton}</div>
          {bannerNode}
        </form>
      </PwaGroupedSection>
    );
  }

  return (
    <div className={inset ? "" : "dashboard-profile-form-slab p-6 md:p-8"}>
      <h2
        className={
          inset
            ? "mb-2 flex items-center gap-2 font-display text-lg font-semibold tracking-tight text-[var(--color-foreground)]"
            : "mb-1 border-l-4 border-[var(--color-accent)] pl-3 font-display text-xl font-bold text-[var(--color-primary)]"
        }
      >
        {inset ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-muted))] ring-1 ring-[color-mix(in_srgb,var(--color-accent)_42%,var(--color-border))]">
            <UserPen className="h-4 w-4 text-[var(--color-accent)]" aria-hidden strokeWidth={2} />
          </span>
        ) : null}
        {labels.personalDetailsTitle}
      </h2>
      <p className={`text-sm text-[var(--color-muted-foreground)] ${inset ? "mb-5 max-w-prose" : "mb-6"}`}>
        {labels.personalDetailsLead}
      </p>
      {lockedNotice}
      <form className="space-y-4" onSubmit={onSubmit}>
        <MyProfilePersonalFields locked={locked} initial={initial} labels={labels} layout={layout} />
        {saveButton}
        {bannerNode}
      </form>
    </div>
  );
}

import type { ReactNode } from "react";
import { Label } from "@/components/atoms/Label";
import type { Dictionary } from "@/types/i18n";
import { MyProfileHomeAddressFields } from "@/components/molecules/MyProfileHomeAddressFields";
import type { MyProfilePersonalFormLayout } from "@/components/molecules/MyProfilePersonalForm";

export interface MyProfilePersonalFieldsProps {
  locked: boolean;
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
  layout: MyProfilePersonalFormLayout;
}

function fieldShell(layout: MyProfilePersonalFormLayout, children: ReactNode) {
  if (layout === "pwa") {
    return (
      <div className="border-b border-[var(--color-border)] px-4 py-3 last:border-b-0">{children}</div>
    );
  }
  return <div>{children}</div>;
}

function inputClass(layout: MyProfilePersonalFormLayout, locked: boolean) {
  const disabled = locked ? " disabled:opacity-60" : "";
  if (layout === "pwa") {
    return `mt-1.5 w-full border-0 bg-transparent p-0 text-base text-[var(--color-foreground)] outline-none ring-0 placeholder:text-[var(--color-muted-foreground)]${disabled}`;
  }
  return `mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm${disabled}`;
}

export function MyProfilePersonalFields({
  locked,
  initial,
  labels,
  layout,
}: MyProfilePersonalFieldsProps) {
  const pwa = layout === "pwa";

  return (
    <>
      {fieldShell(
        layout,
        <>
          <Label htmlFor="mp-first" className={pwa ? "text-xs font-medium text-[var(--color-muted-foreground)]" : undefined}>
            {labels.firstName}
          </Label>
          <input
            id="mp-first"
            name="first_name"
            type="text"
            required
            disabled={locked}
            defaultValue={initial.firstName}
            autoComplete="given-name"
            className={inputClass(layout, locked)}
          />
        </>,
      )}
      {fieldShell(
        layout,
        <>
          <Label htmlFor="mp-last" className={pwa ? "text-xs font-medium text-[var(--color-muted-foreground)]" : undefined}>
            {labels.lastName}
          </Label>
          <input
            id="mp-last"
            name="last_name"
            type="text"
            required
            disabled={locked}
            defaultValue={initial.lastName}
            autoComplete="family-name"
            className={inputClass(layout, locked)}
          />
        </>,
      )}
      {fieldShell(
        layout,
        <>
          <Label htmlFor="mp-phone" className={pwa ? "text-xs font-medium text-[var(--color-muted-foreground)]" : undefined}>
            {labels.phone}
          </Label>
          <input
            id="mp-phone"
            name="phone"
            type="tel"
            disabled={locked}
            defaultValue={initial.phone}
            autoComplete="tel"
            className={inputClass(layout, locked)}
          />
        </>,
      )}
      {fieldShell(
        layout,
        <>
          <Label htmlFor="mp-dni" className={pwa ? "text-xs font-medium text-[var(--color-muted-foreground)]" : undefined}>
            {labels.dni}
          </Label>
          <input
            id="mp-dni"
            name="dni_or_passport"
            type="text"
            required
            disabled={locked}
            defaultValue={initial.dni}
            autoComplete="off"
            className={inputClass(layout, locked)}
          />
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{labels.documentIdFormatHint}</p>
        </>,
      )}
      {fieldShell(
        layout,
        <>
          <Label htmlFor="mp-birth" className={pwa ? "text-xs font-medium text-[var(--color-muted-foreground)]" : undefined}>
            {labels.birthDate}
          </Label>
          <input
            id="mp-birth"
            name="birth_date"
            type="date"
            disabled={locked}
            defaultValue={initial.birthDate}
            autoComplete="bday"
            className={inputClass(layout, locked)}
          />
        </>,
      )}
      {pwa ? (
        <div className="border-b border-[var(--color-border)] px-4 py-3 last:border-b-0">
          <MyProfileHomeAddressFields
            key={`${initial.homeAddressText}|${initial.homePlaceId}`}
            locked={locked}
            initialText={initial.homeAddressText}
            initialPlaceId={initial.homePlaceId}
            labels={labels}
          />
        </div>
      ) : (
        <MyProfileHomeAddressFields
          key={`${initial.homeAddressText}|${initial.homePlaceId}`}
          locked={locked}
          initialText={initial.homeAddressText}
          initialPlaceId={initial.homePlaceId}
          labels={labels}
        />
      )}
    </>
  );
}

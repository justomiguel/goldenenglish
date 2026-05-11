"use client";

import { MapPin, Pencil } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import type { ProfileHomeAddressMapLabels } from "@/components/molecules/ProfileHomeAddressMap";
import { ProfileHomeAddressMap } from "@/components/molecules/ProfileHomeAddressMap";

type UserLabels = Dictionary["admin"]["users"];

const valueButtonClass =
  "group flex w-full min-h-[44px] items-center justify-between gap-2 rounded-[var(--layout-border-radius)] border border-transparent px-1 text-left text-sm text-[var(--color-foreground)] transition-colors hover:border-[var(--color-border)] hover:bg-[var(--color-muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]";

export interface AdminUserHomeAddressFieldReadPanelProps {
  mapsKey: string;
  editable: boolean;
  display: string;
  homeAddressText: string;
  homePlaceId: string | null;
  mapsHref: string | null;
  labels: UserLabels;
  mapLabels: ProfileHomeAddressMapLabels;
  onStartEdit: () => void;
}

export function AdminUserHomeAddressFieldReadPanel({
  mapsKey,
  editable,
  display,
  homeAddressText,
  homePlaceId,
  mapsHref,
  labels,
  mapLabels,
  onStartEdit,
}: AdminUserHomeAddressFieldReadPanelProps) {
  const showMapsLink = Boolean(mapsHref && homeAddressText.trim().length > 0);

  return (
    <dd className="mt-1 space-y-2">
      {editable ? (
        <button
          type="button"
          className={valueButtonClass}
          onClick={onStartEdit}
          aria-label={`${labels.detailEditFieldPrefix} ${labels.detailFieldHomeAddress}`}
        >
          <span className="min-w-0 break-words">{display}</span>
          <Pencil
            className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)] opacity-70 group-hover:opacity-100"
            aria-hidden
          />
        </button>
      ) : (
        <span className="text-sm text-[var(--color-foreground)]">{display}</span>
      )}
      {mapsKey ? (
        <ProfileHomeAddressMap
          apiKey={mapsKey}
          addressText={homeAddressText}
          placeId={homePlaceId}
          labels={mapLabels}
          title={labels.detailHomeAddressMapPreviewTitle}
        />
      ) : null}
      {showMapsLink ? (
        <a
          href={mapsHref!}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {labels.detailOpenInGoogleMaps}
        </a>
      ) : null}
    </dd>
  );
}

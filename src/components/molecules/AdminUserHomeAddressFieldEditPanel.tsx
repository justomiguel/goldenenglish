"use client";

import { Check, X } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";
import { GooglePlacesAddressInput } from "@/components/molecules/GooglePlacesAddressInput";
import type { ProfileHomeAddressMapLabels } from "@/components/molecules/ProfileHomeAddressMap";
import { ProfileHomeAddressMap } from "@/components/molecules/ProfileHomeAddressMap";

type UserLabels = Dictionary["admin"]["users"];

export interface AdminUserHomeAddressFieldEditPanelProps {
  userId: string;
  mapsKey: string;
  busy: boolean;
  draftText: string;
  draftPlaceId: string;
  labels: UserLabels;
  mapLabels: ProfileHomeAddressMapLabels;
  onDraftTextChange: (next: string) => void;
  onResolvedPlace: (formattedAddress: string, placeId: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function AdminUserHomeAddressFieldEditPanel({
  userId,
  mapsKey,
  busy,
  draftText,
  draftPlaceId,
  labels,
  mapLabels,
  onDraftTextChange,
  onResolvedPlace,
  onSave,
  onCancel,
}: AdminUserHomeAddressFieldEditPanelProps) {
  const pid = draftPlaceId.trim().length > 0 ? draftPlaceId.trim() : null;

  return (
    <dd className="mt-2 space-y-2">
      {mapsKey ? (
        <GooglePlacesAddressInput
          apiKey={mapsKey}
          id={`home-addr-${userId}`}
          value={draftText}
          onChange={onDraftTextChange}
          onResolvedPlace={({ formattedAddress, placeId }) => {
            onResolvedPlace(formattedAddress, placeId ?? "");
          }}
          disabled={busy}
          aria-label={labels.detailFieldHomeAddress}
          placeholder={labels.detailHomeAddressPlacesHint}
        />
      ) : (
        <textarea
          id={`home-addr-fallback-${userId}`}
          value={draftText}
          onChange={(e) => onDraftTextChange(e.target.value)}
          disabled={busy}
          rows={3}
          aria-label={labels.detailFieldHomeAddress}
          className="w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        />
      )}
      {!mapsKey ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.detailHomeAddressFallbackHint}</p>
      ) : (
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.detailHomeAddressPlacesHint}</p>
      )}
      {mapsKey ? (
        <ProfileHomeAddressMap
          apiKey={mapsKey}
          addressText={draftText}
          placeId={pid}
          labels={mapLabels}
          title={labels.detailHomeAddressMapPreviewTitle}
        />
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="primary" size="sm" isLoading={busy} onClick={onSave} className="gap-1.5">
          <Check className="h-4 w-4 shrink-0" aria-hidden />
          {labels.detailConfirmSave}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onCancel} className="gap-1.5">
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {labels.detailCancelEdit}
        </Button>
      </div>
    </dd>
  );
}

"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { Label } from "@/components/atoms/Label";
import { GooglePlacesAddressInput } from "@/components/molecules/GooglePlacesAddressInput";
import { ProfileHomeAddressMap } from "@/components/molecules/ProfileHomeAddressMap";
import { readGoogleMapsBrowserKey } from "@/lib/site/googleMapsBrowserKey";
import { googleMapsSearchUrl } from "@/lib/maps/googleMapsSearchUrl";

type Labels = Dictionary["dashboard"]["myProfile"];

export interface MyProfileHomeAddressFieldsProps {
  locked: boolean;
  initialText: string;
  initialPlaceId: string;
  labels: Labels;
}

export function MyProfileHomeAddressFields({
  locked,
  initialText,
  initialPlaceId,
  labels,
}: MyProfileHomeAddressFieldsProps) {
  const mapsKey = readGoogleMapsBrowserKey();
  const [text, setText] = useState(initialText);
  const [placeId, setPlaceId] = useState(initialPlaceId);

  const mapsHref = useMemo(() => googleMapsSearchUrl(text, placeId), [placeId, text]);

  const mapLabels = useMemo(
    () => ({
      mapPreviewEmpty: labels.homeAddressMapPreviewEmpty,
      mapPreviewLoading: labels.homeAddressMapPreviewLoading,
      mapPreviewUnavailable: labels.homeAddressMapPreviewUnavailable,
    }),
    [
      labels.homeAddressMapPreviewEmpty,
      labels.homeAddressMapPreviewLoading,
      labels.homeAddressMapPreviewUnavailable,
    ],
  );

  return (
    <div className="space-y-2">
      <input type="hidden" name="home_place_id" value={placeId} readOnly />
      <Label htmlFor="mp-home-address">{labels.homeAddress}</Label>
      {mapsKey ? (
        <GooglePlacesAddressInput
          apiKey={mapsKey}
          id="mp-home-address"
          name="home_address_text"
          value={text}
          onChange={(next) => {
            setText(next);
            setPlaceId("");
          }}
          onResolvedPlace={({ formattedAddress, placeId: pid }) => {
            setText(formattedAddress);
            setPlaceId(pid ?? "");
          }}
          disabled={locked}
          aria-label={labels.homeAddress}
          placeholder={labels.homeAddressHint}
        />
      ) : (
        <textarea
          id="mp-home-address"
          name="home_address_text"
          rows={3}
          disabled={locked}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPlaceId("");
          }}
          aria-label={labels.homeAddress}
          className="mt-2 w-full rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm disabled:opacity-60"
        />
      )}
      {!mapsKey ? (
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.homeAddressFallbackHint}</p>
      ) : (
        <p className="text-xs text-[var(--color-muted-foreground)]">{labels.homeAddressHint}</p>
      )}
      {mapsKey ? (
        <ProfileHomeAddressMap
          apiKey={mapsKey}
          addressText={text}
          placeId={placeId.trim().length > 0 ? placeId.trim() : null}
          labels={mapLabels}
          title={labels.homeAddressMapPreviewTitle}
        />
      ) : null}
      {mapsHref && text.trim().length > 0 ? (
        <a
          href={mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center gap-2 text-sm font-medium text-[var(--color-primary)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <MapPin className="h-4 w-4 shrink-0" aria-hidden />
          {labels.openInGoogleMaps}
        </a>
      ) : null}
    </div>
  );
}

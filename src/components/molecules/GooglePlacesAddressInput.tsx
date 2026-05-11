"use client";

import { type ChangeEvent, useEffect, useRef } from "react";
import { Input } from "@/components/atoms/Input";
import { loadGoogleMapsPlacesScript } from "@/lib/client/loadGoogleMapsPlacesScript";
import { normalizeGooglePlaceIdForStorage } from "@/lib/maps/normalizeGooglePlaceId";

export type GooglePlacesResolved = { formattedAddress: string; placeId: string | null };

export interface GooglePlacesAddressInputProps {
  apiKey: string;
  id: string;
  name?: string;
  value: string;
  onChange: (next: string) => void;
  onResolvedPlace?: (resolved: GooglePlacesResolved) => void;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  autoComplete?: string;
}

/** Mirrors legacy `Autocomplete` option `types: ["address"]` — precise street-level results. */
const ADDRESS_PRIMARY_TYPES = ["street_address", "premise", "subpremise"] as const;

type PacElement = HTMLElement & {
  value: string;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
  input?: HTMLInputElement;
};

type PlacePredictionSelectEvent = Event & {
  placePrediction: { toPlace: () => PlaceFacade };
};

type PlaceFacade = {
  fetchFields: (opts: { fields: string[] }) => Promise<void>;
  formattedAddress?: string;
  id?: string;
};

type PlacesLibrary = {
  PlaceAutocompleteElement?: new (opts?: Record<string, unknown>) => PacElement;
};

type MapsRoot = {
  importLibrary?: (lib: string) => Promise<PlacesLibrary>;
};

export function GooglePlacesAddressInput({
  apiKey,
  id,
  name,
  value,
  onChange,
  onResolvedPlace,
  disabled,
  placeholder,
  "aria-label": ariaLabel,
  autoComplete = "street-address",
}: GooglePlacesAddressInputProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pacRef = useRef<PacElement | null>(null);
  const onChangeRef = useRef(onChange);
  const onResolvedRef = useRef(onResolvedPlace);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    onResolvedRef.current = onResolvedPlace;
  }, [onResolvedPlace]);

  useEffect(() => {
    if (!apiKey || disabled) return;
    let cancelled = false;

    const onInput = () => {
      const el = pacRef.current;
      if (el) onChangeRef.current(el.value);
    };

    const onGmpSelect = async (ev: Event) => {
      const e = ev as PlacePredictionSelectEvent;
      try {
        const place = e.placePrediction.toPlace();
        await place.fetchFields({ fields: ["formattedAddress", "id"] });
        const formatted = place.formattedAddress?.trim();
        const pid = normalizeGooglePlaceIdForStorage(place.id ?? null);
        if (formatted) {
          onResolvedRef.current?.({ formattedAddress: formatted, placeId: pid });
        }
      } catch {
        /* ignored — widget surfaced suggestion errors separately when applicable */
      }
    };

    void loadGoogleMapsPlacesScript(apiKey).then(async () => {
      if (cancelled || !wrapRef.current) return;
      const gm = (globalThis as unknown as { google?: { maps?: MapsRoot } }).google?.maps;
      if (typeof gm?.importLibrary !== "function") return;

      const placesLib = (await gm.importLibrary("places")) as PlacesLibrary;
      if (cancelled || !wrapRef.current) return;

      const Ctor = placesLib.PlaceAutocompleteElement;
      if (!Ctor || !wrapRef.current) return;

      const el = new Ctor({
        includedPrimaryTypes: [...ADDRESS_PRIMARY_TYPES],
        placeholder: placeholder ?? "",
        name: name ?? undefined,
        requestedLanguage: typeof navigator !== "undefined" ? navigator.language?.slice(0, 5) : undefined,
      });
      el.id = id;
      el.value = value;
      el.disabled = !!disabled;

      el.style.width = "100%";
      el.style.borderRadius = "var(--layout-border-radius)";
      el.style.borderWidth = "1px";
      el.style.borderStyle = "solid";
      el.style.borderColor = "var(--color-border)";
      el.style.fontSize = "0.875rem";
      el.style.boxSizing = "border-box";

      el.addEventListener("input", onInput);
      el.addEventListener("gmp-select", onGmpSelect);

      if (cancelled || !wrapRef.current) {
        el.remove();
        return;
      }
      wrapRef.current.replaceChildren(el);
      pacRef.current = el;

      queueMicrotask(() => {
        if (cancelled) return;
        if (ariaLabel && el.input) el.input.setAttribute("aria-label", ariaLabel);
        el.input?.setAttribute("autoComplete", autoComplete);
      });
    });

    return () => {
      cancelled = true;
      const el = pacRef.current;
      pacRef.current = null;
      if (el) {
        el.removeEventListener("input", onInput);
        el.removeEventListener("gmp-select", onGmpSelect);
        el.remove();
      }
    };
  }, [apiKey, ariaLabel, autoComplete, disabled, id, name, placeholder]);

  useEffect(() => {
    const el = pacRef.current;
    if (el && el.value !== value) el.value = value;
  }, [value]);

  useEffect(() => {
    const el = pacRef.current;
    if (el) el.disabled = !!disabled;
  }, [disabled]);

  if (!apiKey || disabled) {
    return (
      <Input
        id={id}
        name={name}
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete={autoComplete}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    );
  }

  return <div ref={wrapRef} className="w-full min-h-[42px]" />;
}

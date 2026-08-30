"use client";

import { marketingLandingCopy } from "@/lib/landing/mzLandingCopy";
import type { Dictionary } from "@/types/i18n";
import { useNagoSound } from "@/components/organisms/NagoSoundRoot";

export function NagoSoundToggle({ dict }: { dict: Dictionary }) {
  const { enabled, toggle } = useNagoSound();
  const on = marketingLandingCopy(dict, "nago", "chrome.soundOn");
  const off = marketingLandingCopy(dict, "nago", "chrome.soundOff");

  return (
    <button
      type="button"
      className="nago-sound-toggle"
      aria-pressed={enabled}
      aria-label={enabled ? off : on}
      onClick={toggle}
    >
      {enabled ? "🔊" : "🔇"}
    </button>
  );
}

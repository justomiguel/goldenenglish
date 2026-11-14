"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { playNagoBerimbauSignature } from "@/lib/landing/playNagoBerimbau";

interface NagoSoundValue {
  enabled: boolean;
  toggle: () => void;
  playSignature: () => void;
}

const NagoSoundContext = createContext<NagoSoundValue>({
  enabled: false,
  toggle: () => {},
  playSignature: () => {},
});

export function useNagoSound(): NagoSoundValue {
  return useContext(NagoSoundContext);
}

export function NagoSoundRoot({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);

  const playSignature = useCallback(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    playNagoBerimbauSignature();
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      if (next) playNagoBerimbauSignature();
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ enabled, toggle, playSignature }),
    [enabled, toggle, playSignature],
  );

  return <NagoSoundContext.Provider value={value}>{children}</NagoSoundContext.Provider>;
}

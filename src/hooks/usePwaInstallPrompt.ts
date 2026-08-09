"use client";

import { useCallback, useEffect, useState } from "react";
import { logClientWarn } from "@/lib/logging/clientLog";

const STORAGE_KEY = "ge_pwa_install_prompt_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function usePwaInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosHint, setIosHint] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || isStandalone()) return;
    // Dismissing hides the floating banner, not the capability: the account sheet
    // still offers the install action afterwards.
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      logClientWarn("usePwaInstallPrompt:read_dismissed");
    }
    if (isIosSafari()) {
      queueMicrotask(() => {
        setIosHint(true);
        if (!dismissed) setVisible(true);
      });
      return;
    }
    const onBip = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      if (!dismissed) setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      logClientWarn("usePwaInstallPrompt:write_dismissed");
    }
    setVisible(false);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    setBusy(true);
    try {
      await deferred.prompt();
      await deferred.userChoice;
    } catch {
      logClientWarn("usePwaInstallPrompt:prompt_failed");
    } finally {
      setBusy(false);
      dismiss();
    }
  }, [deferred, dismiss]);

  /** A real install prompt is available; iOS Safari only ever gets the hint banner. */
  const installable = deferred !== null;

  return { visible, iosHint, busy, deferred, installable, dismiss, install };
}

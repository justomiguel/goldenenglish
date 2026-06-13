"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { logClientWarn } from "@/lib/logging/clientLog";
import { subscribeToPush } from "@/lib/push/subscribePushClient";

export type PushPermissionBannerCopy = {
  pushTitle: string;
  pushLead: string;
  pushEnable: string;
  pushLater: string;
};

export interface PushPermissionBannerProps {
  copy: PushPermissionBannerCopy;
  storageKey?: string;
}

export function PushPermissionBanner({
  copy,
  storageKey = "ge_push_prompt_dismissed",
}: PushPermissionBannerProps) {
  const [hidden, setHidden] = useState(true);
  const [unsupported, setUnsupported] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      try {
        if (window.localStorage.getItem(storageKey) === "1") {
          setHidden(true);
          return;
        }
      } catch {
        logClientWarn("PushPermissionBanner:read_dismissed");
      }
      if (!("Notification" in window)) {
        setUnsupported(true);
        setHidden(true);
        return;
      }
      if (Notification.permission === "granted" || Notification.permission === "denied") {
        setHidden(true);
        return;
      }
      setHidden(false);
    });
  }, [storageKey]);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(storageKey, "1");
    } catch {
      logClientWarn("PushPermissionBanner:write_dismissed");
    }
    setHidden(true);
  }, [storageKey]);

  const request = useCallback(async () => {
    setBusy(true);
    try {
      const result = await subscribeToPush();
      if (!result.ok && result.code !== "denied") {
        logClientWarn("PushPermissionBanner:subscribe", { code: result.code });
      }
    } catch {
      logClientWarn("PushPermissionBanner:subscribe_exception");
    } finally {
      setBusy(false);
      dismiss();
    }
  }, [dismiss]);

  if (unsupported || hidden) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <p className="text-sm font-medium text-[var(--color-foreground)]">{copy.pushTitle}</p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{copy.pushLead}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void request()} disabled={busy}>
          <Bell className="h-4 w-4 shrink-0" aria-hidden />
          {copy.pushEnable}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={dismiss} disabled={busy}>
          <X className="h-4 w-4 shrink-0" aria-hidden />
          {copy.pushLater}
        </Button>
      </div>
    </div>
  );
}

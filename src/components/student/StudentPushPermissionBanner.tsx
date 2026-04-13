"use client";

import { useCallback, useEffect, useState } from "react";
import type { Dictionary } from "@/types/i18n";
import { Button } from "@/components/atoms/Button";

type HubDict = Dictionary["dashboard"]["student"]["hub"];

const STORAGE_KEY = "ge_student_push_prompt_dismissed";

export interface StudentPushPermissionBannerProps {
  dict: HubDict;
}

export function StudentPushPermissionBanner({ dict }: StudentPushPermissionBannerProps) {
  const [hidden, setHidden] = useState(true);
  const [unsupported, setUnsupported] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      try {
        if (window.localStorage.getItem(STORAGE_KEY) === "1") {
          setHidden(true);
          return;
        }
      } catch {
        /* ignore */
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
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
  }, []);

  const request = useCallback(async () => {
    if (!("Notification" in window)) return;
    try {
      await Notification.requestPermission();
    } catch {
      /* ignore */
    }
    dismiss();
  }, [dismiss]);

  if (unsupported || hidden) return null;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <p className="text-sm font-medium text-[var(--color-foreground)]">{dict.pushTitle}</p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{dict.pushLead}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={() => void request()}>
          {dict.pushEnable}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={dismiss}>
          {dict.pushLater}
        </Button>
      </div>
    </div>
  );
}

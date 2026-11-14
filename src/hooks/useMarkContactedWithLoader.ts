"use client";

import { useState } from "react";
import type { AdminRegistrationRow } from "@/types/adminRegistration";

export type RegistrationWorkTask = () => Promise<string | null | void>;

export function useRegistrationWorkLoader(close: () => void) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function track(task: RegistrationWorkTask) {
    close();
    setError(null);
    setOpen(true);
    void Promise.resolve()
      .then(task)
      .then((message) => {
        if (typeof message === "string" && message.trim()) {
          setError(message);
          return;
        }
        setOpen(false);
      })
      .catch(() => {
        setOpen(false);
      });
  }

  function dismiss() {
    setError(null);
    setOpen(false);
  }

  return { open, error, track, dismiss };
}

export function useMarkContactedWithLoader(
  onMarkContacted: (row: AdminRegistrationRow) => void | Promise<unknown>,
  close: () => void,
) {
  const work = useRegistrationWorkLoader(close);

  function mark(row: AdminRegistrationRow) {
    work.track(async () => {
      await onMarkContacted(row);
      return null;
    });
  }

  return { ...work, mark };
}

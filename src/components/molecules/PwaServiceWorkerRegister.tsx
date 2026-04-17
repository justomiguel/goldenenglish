"use client";

import { useEffect } from "react";
import { logClientWarn } from "@/lib/logging/clientLog";
import { serializeUnknownError } from "@/lib/logging/serverActionLog";

export function PwaServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      typeof navigator === "undefined" ||
      !navigator.serviceWorker ||
      typeof navigator.serviceWorker.register !== "function"
    ) {
      return;
    }
    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (err) {
        logClientWarn("PwaServiceWorkerRegister:register_failed", {
          error: serializeUnknownError(err),
        });
      }
    };
    void register();
  }, []);

  return null;
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  mountDailyCallFrame,
  type DailyCallHandle,
} from "@/components/daily/mountDailyCallFrame";

export function useDailyCallSession(input: {
  url: string;
  token: string;
  backHref: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<DailyCallHandle | null>(null);
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let cancelled = false;

    void mountDailyCallFrame(el, { url: input.url, token: input.token }).then((handle) => {
      if (cancelled) {
        void handle.leave().finally(() => handle.destroy());
        return;
      }
      handleRef.current = handle;
    });

    return () => {
      cancelled = true;
      const handle = handleRef.current;
      handleRef.current = null;
      if (handle) {
        void handle.leave().finally(() => handle.destroy());
      }
    };
  }, [input.url, input.token]);

  async function onLeave() {
    if (leaving) return;
    setLeaving(true);
    const handle = handleRef.current;
    handleRef.current = null;
    if (handle) {
      await handle.leave();
      handle.destroy();
    }
    router.push(input.backHref);
  }

  return { containerRef, onLeave, leaving };
}

"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Dictionary } from "@/types/i18n";

export function ViewAsEndedNotice({ dict }: { dict: Dictionary }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const ended = params.get("viewAs") === "ended";

  useEffect(() => {
    if (!ended) return;
    const next = new URLSearchParams(params.toString());
    next.delete("viewAs");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [ended, params, pathname, router]);

  if (!ended) return null;

  return (
    <p
      role="status"
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm text-[var(--color-foreground)]"
    >
      {dict.dashboard.viewAs.ended}
    </p>
  );
}

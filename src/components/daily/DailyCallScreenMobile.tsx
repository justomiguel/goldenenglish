"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { useDailyCallSession } from "@/components/daily/useDailyCallSession";

export interface DailyCallScreenMobileProps {
  url: string;
  token: string;
  leaveLabel: string;
  backHref: string;
}

export function DailyCallScreenMobile({
  url,
  token,
  leaveLabel,
  backHref,
}: DailyCallScreenMobileProps) {
  const { containerRef, onLeave, leaving } = useDailyCallSession({ url, token, backHref });

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-background)] pt-[env(safe-area-inset-top)]">
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden bg-[var(--color-muted)]" />
      <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 pb-[env(safe-area-inset-bottom)]">
        <Button
          type="button"
          className="min-h-[44px] w-full"
          onClick={() => void onLeave()}
          isLoading={leaving}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          {leaveLabel}
        </Button>
      </div>
    </div>
  );
}

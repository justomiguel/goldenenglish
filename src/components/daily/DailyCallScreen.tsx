"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { useDailyCallSession } from "@/components/daily/useDailyCallSession";

export interface DailyCallScreenProps {
  url: string;
  token: string;
  leaveLabel: string;
  backHref: string;
}

export function DailyCallScreen({ url, token, leaveLabel, backHref }: DailyCallScreenProps) {
  const { containerRef, onLeave, leaving } = useDailyCallSession({ url, token, backHref });

  return (
    <div className="flex min-h-[32rem] flex-col gap-4">
      <div ref={containerRef} className="min-h-[24rem] flex-1 overflow-hidden rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]" />
      <Button type="button" onClick={() => void onLeave()} isLoading={leaving}>
        <LogOut className="h-4 w-4" aria-hidden />
        {leaveLabel}
      </Button>
    </div>
  );
}

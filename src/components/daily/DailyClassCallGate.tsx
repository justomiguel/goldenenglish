"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { DailyCallScreen } from "@/components/daily/DailyCallScreen";
import { DailyCallScreenMobile } from "@/components/daily/DailyCallScreenMobile";

export function DailyClassCallGate({
  url,
  token,
  leaveLabel,
  backHref,
}: {
  url: string;
  token: string;
  leaveLabel: string;
  backHref: string;
}) {
  return (
    <SurfaceMountGate
      skeleton={
        <div
          className="h-64 animate-pulse rounded-[var(--layout-border-radius)] bg-[var(--color-muted)]"
          aria-hidden
        />
      }
      desktop={
        <DailyCallScreen url={url} token={token} leaveLabel={leaveLabel} backHref={backHref} />
      }
      narrow={() => (
        <DailyCallScreenMobile url={url} token={token} leaveLabel={leaveLabel} backHref={backHref} />
      )}
    />
  );
}

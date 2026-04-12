"use client";

import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import {
  ProfileAvatarPanel,
  type ProfileAvatarFormLabels,
} from "@/components/molecules/ProfileAvatarPanel";
import type { AppSurface } from "@/hooks/useAppSurface";

function PortalProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-40 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export interface PortalProfileSurfaceEntryProps {
  title: string;
  lead: string;
  locale: string;
  avatarDisplayUrl: string | null;
  displayName: string;
  labels: ProfileAvatarFormLabels;
}

export function PortalProfileSurfaceEntry({
  title,
  lead,
  locale,
  avatarDisplayUrl,
  displayName,
  labels,
}: PortalProfileSurfaceEntryProps) {
  const panel = (
    <>
      <h1 className="mb-2 font-display text-3xl font-bold text-[var(--color-secondary)]">{title}</h1>
      <p className="mb-8 text-[var(--color-muted-foreground)]">{lead}</p>
      <ProfileAvatarPanel
        locale={locale}
        avatarDisplayUrl={avatarDisplayUrl}
        displayName={displayName}
        labels={labels}
      />
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={<PortalProfileSkeleton />}
      desktop={<div>{panel}</div>}
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] space-y-4 py-2">{panel}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}

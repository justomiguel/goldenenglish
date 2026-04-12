"use client";

import Link from "next/link";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import type { AppSurface } from "@/hooks/useAppSurface";
import { MyProfileScreen, type MyProfileScreenProps } from "@/components/organisms/MyProfileScreen";

export interface MyProfileSurfaceEntryProps extends MyProfileScreenProps {
  backHref: string;
  localeSwitcher: Dictionary["common"]["locale"];
}

function MyProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-hidden>
      <div className="h-10 max-w-md rounded bg-[var(--color-muted)]" />
      <div className="h-40 rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-muted)]" />
    </div>
  );
}

export function MyProfileSurfaceEntry({
  backHref,
  localeSwitcher,
  labels,
  ...screen
}: MyProfileSurfaceEntryProps) {
  const toolbar = (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <Link
        href={backHref}
        className="inline-flex min-h-[44px] min-w-[44px] items-center rounded-[var(--layout-border-radius)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-muted)]"
      >
        {labels.backToDashboard}
      </Link>
      <LanguageSwitcher locale={screen.locale} labels={localeSwitcher} />
    </div>
  );

  const inner = (
    <>
      {toolbar}
      <h1 className="mb-2 font-display text-3xl font-bold text-[var(--color-secondary)]">{labels.title}</h1>
      <p className="mb-8 text-sm text-[var(--color-muted-foreground)]">{labels.lead}</p>
      <MyProfileScreen labels={labels} {...screen} />
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={<MyProfileSkeleton />}
      desktop={
        <div className="min-h-screen bg-[var(--color-muted)] px-3 py-8 md:px-6">
          <div className="mx-auto max-w-[var(--layout-max-width)]">{inner}</div>
        </div>
      }
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="min-h-dvh bg-[var(--color-muted)] px-3 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
            <div className="mx-auto max-w-[var(--layout-max-width)] py-2">{inner}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}

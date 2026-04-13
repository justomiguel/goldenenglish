"use client";

import Link from "next/link";
import { ChevronLeft, UserCircle } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { SurfaceMountGate } from "@/components/molecules/SurfaceMountGate";
import { PwaPageShell } from "@/components/pwa/molecules/PwaPageShell";
import { LanguageSwitcher } from "@/components/molecules/LanguageSwitcher";
import type { AppSurface } from "@/hooks/useAppSurface";
import { MyProfileScreen, type MyProfileScreenProps } from "./MyProfileScreen";

export interface MyProfileSurfaceEntryProps extends MyProfileScreenProps {
  backHref: string;
  localeSwitcher: Dictionary["common"]["locale"];
}

function MyProfileSkeleton() {
  return (
    <div className="dashboard-profile-shell min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-8 md:max-w-[48rem] md:px-6" aria-hidden>
        <div className="h-11 w-40 animate-pulse rounded-lg bg-[var(--color-muted)]" />
        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="h-28 animate-pulse bg-[var(--color-muted)] sm:h-32" />
          <div className="space-y-4 p-6">
            <div className="-mt-12 h-24 w-24 animate-pulse rounded-full bg-[var(--color-muted)]" />
            <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-muted)]" />
            <div className="h-20 max-w-md animate-pulse rounded-lg bg-[var(--color-muted)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyProfileSurfaceEntry({
  backHref,
  localeSwitcher,
  labels,
  ...screen
}: MyProfileSurfaceEntryProps) {
  const header = (
    <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 py-3 md:max-w-[48rem] md:px-6">
        <Link
          href={backHref}
          className="justify-self-start inline-flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full px-2 py-2 text-sm font-semibold text-[var(--color-primary)] transition hover:bg-[var(--color-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
        >
          <ChevronLeft className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2.25} />
          <span className="max-w-[9rem] truncate sm:max-w-[13rem]">{labels.backToDashboard}</span>
        </Link>
        <p
          id="dashboard-profile-page-label"
          className="col-start-2 m-0 flex max-w-[min(100%,14rem)] items-center justify-center gap-2 justify-self-center text-center sm:max-w-none"
        >
          <UserCircle
            className="h-5 w-5 shrink-0 text-[var(--color-primary)]"
            aria-hidden
            strokeWidth={2}
          />
          <span className="truncate font-display text-sm font-bold tracking-tight text-[var(--color-secondary)] sm:text-base">
            {labels.title}
          </span>
        </p>
        <div className="justify-self-end">
          <LanguageSwitcher locale={screen.locale} labels={localeSwitcher} />
        </div>
      </div>
    </header>
  );

  const main = (
    <main
      aria-labelledby="dashboard-profile-page-label"
      className="motion-safe:animate-fade-up mx-auto max-w-3xl px-4 pb-[max(3rem,env(safe-area-inset-bottom,0px))] pt-6 md:max-w-[48rem] md:px-6 md:pb-12 md:pt-8"
    >
      <MyProfileScreen labels={labels} {...screen} />
    </main>
  );

  const inner = (
    <>
      {header}
      {main}
    </>
  );

  return (
    <SurfaceMountGate
      skeleton={<MyProfileSkeleton />}
      desktop={
        <div className="dashboard-profile-shell relative min-h-screen">
          <div className="relative z-[1]">{inner}</div>
        </div>
      }
      narrow={(surface: Extract<AppSurface, "web-mobile" | "pwa-mobile">) => (
        <PwaPageShell surface={surface}>
          <div className="dashboard-profile-shell relative min-h-dvh">
            <div className="relative z-[1] pt-[max(0.25rem,env(safe-area-inset-top,0px))]">{inner}</div>
          </div>
        </PwaPageShell>
      )}
    />
  );
}

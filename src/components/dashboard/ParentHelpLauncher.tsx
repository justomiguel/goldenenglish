"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelp } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { AdminHelpChatPanel } from "@/components/dashboard/AdminHelpChatPanel";
import { ParentHelpExplainScreenBlock } from "@/components/dashboard/ParentHelpExplainScreenBlock";
import { ParentHelpTutorialList } from "@/components/dashboard/ParentHelpTutorialList";
import type { ParentTutorialId } from "@/lib/parent-tutorials/catalog";
import { startParentTutorial } from "@/lib/parent-tutorials/client/startParentTutorial";
import { startExplainParentScreenTour } from "@/lib/parent-tutorials/client/startExplainParentScreenTour";
import { resolveParentScreenTour } from "@/lib/parent-tutorials/screenCatalog";
import { useAppSurface } from "@/hooks/useAppSurface";
import { appSurfaceToParentTourSurface } from "@/lib/parent-tutorials/appSurfaceToParentTourSurface";

export interface ParentHelpLauncherProps {
  locale: string;
  launcherDict: Dictionary["dashboard"]["parentHelpLauncher"];
  catalogDict: Dictionary["dashboard"]["parentHelpCatalog"];
  toursDict: Dictionary["dashboard"]["parentHelpTours"];
  explainScreenDict: Dictionary["dashboard"]["parentHelpExplainScreen"];
  screenToursDict: Dictionary["dashboard"]["parentHelpScreenTours"];
  /** First linked ward for task tours that need a child id. */
  defaultStudentId?: string;
}

export function ParentHelpLauncher({
  locale,
  launcherDict,
  catalogDict,
  toursDict,
  explainScreenDict,
  screenToursDict,
  defaultStudentId,
}: ParentHelpLauncherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const surface = useAppSurface();
  const tourSurface = appSurfaceToParentTourSurface(surface);
  const alwaysVisible = surface !== "web-desktop";
  const idPrefix = useId().replace(/:/g, "");
  const panelId = `parent-help-chat-${idPrefix}`;
  const titleId = `${panelId}-title`;
  const descId = `${panelId}-desc`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<ParentTutorialId | null>(null);
  const [explainBusy, setExplainBusy] = useState(false);

  const screenMatch = resolveParentScreenTour(pathname, locale);
  const screenMeta = screenMatch
    ? screenToursDict[screenMatch.metaKey]?.meta
    : null;

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);
    if (next) {
      setBusyId(null);
      setExplainBusy(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const root = rootRef.current;
      if (!root || !(e.target instanceof Node)) return;
      if (!root.contains(e.target)) handleOpenChange(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleOpenChange(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, handleOpenChange]);

  const startTutorial = useCallback(
    (id: ParentTutorialId) => {
      handleOpenChange(false);
      setBusyId(id);
      void startParentTutorial({
        id,
        locale,
        pathname,
        surface: tourSurface,
        toursDict,
        push: (href) => router.push(href),
        defaultStudentId,
      }).finally(() => {
        setBusyId(null);
      });
    },
    [locale, pathname, toursDict, router, handleOpenChange, tourSurface, defaultStudentId],
  );

  const startExplain = useCallback(() => {
    handleOpenChange(false);
    setExplainBusy(true);
    void startExplainParentScreenTour({
      locale,
      pathname,
      surface: tourSurface,
      screenToursDict,
    }).finally(() => {
      setExplainBusy(false);
    });
  }, [locale, pathname, screenToursDict, handleOpenChange, tourSurface]);

  const fabPosition = alwaysVisible
    ? "pointer-events-none fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 z-40 flex flex-col items-end"
    : "pointer-events-none fixed bottom-5 right-5 z-40 hidden flex-col items-end md:bottom-8 md:right-8 md:flex";

  return (
    <div ref={rootRef} className={fabPosition}>
      {open ? (
        <div className="pointer-events-auto mb-3 max-h-[min(70vh,32rem)] w-[min(100vw-2rem,22rem)] overflow-y-auto">
          <AdminHelpChatPanel
            id={panelId}
            titleId={titleId}
            title={launcherDict.helpTitle}
            descriptionId={descId}
            description={launcherDict.panelDesc}
            closeLabel={launcherDict.closePanel}
            onClose={() => handleOpenChange(false)}
          >
            <ParentHelpExplainScreenBlock
              dict={explainScreenDict}
              screenTitle={screenMeta?.title ?? null}
              screenDescription={screenMeta?.description ?? null}
              available={screenMatch != null}
              busy={explainBusy}
              onStart={startExplain}
            />
            <ParentHelpTutorialList
              dict={catalogDict}
              onStart={startTutorial}
              busyId={busyId}
            />
          </AdminHelpChatPanel>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => handleOpenChange(!open)}
        aria-label={launcherDict.fabAria}
        aria-expanded={open}
        aria-controls={panelId}
        title={launcherDict.fabTitle}
        className="pointer-events-auto inline-flex h-12 w-12 min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg transition-[transform,box-shadow,background-color] duration-200 ease-out hover:scale-105 hover:bg-[var(--color-primary-dark)] hover:shadow-xl active:scale-95 active:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary)] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      >
        <CircleHelp className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} />
      </button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CircleHelp } from "lucide-react";
import type { Dictionary } from "@/types/i18n";
import { AdminHelpChatPanel } from "@/components/dashboard/AdminHelpChatPanel";
import { AdminHelpExplainScreenBlock } from "@/components/dashboard/AdminHelpExplainScreenBlock";
import { AdminHelpTutorialList } from "@/components/dashboard/AdminHelpTutorialList";
import type { AdminTutorialId } from "@/lib/admin-tutorials/catalog";
import { startAdminTutorial } from "@/lib/admin-tutorials/client/startAdminTutorial";
import { startExplainScreenTour } from "@/lib/admin-tutorials/client/startExplainScreenTour";
import { resolveAdminScreenTour } from "@/lib/admin-tutorials/screenCatalog";
import { useAppSurface } from "@/hooks/useAppSurface";

export interface AdminHelpLauncherProps {
  locale: string;
  launcherDict: Dictionary["dashboard"]["adminHelpLauncher"];
  catalogDict: Dictionary["dashboard"]["adminHelpCatalog"];
  catalogGroupsDict: Dictionary["dashboard"]["adminHelpCatalogGroups"];
  toursDict: Dictionary["dashboard"]["adminHelpTours"];
  explainScreenDict: Dictionary["dashboard"]["adminHelpExplainScreen"];
  screenToursDict: Dictionary["dashboard"]["adminHelpScreenTours"];
}

/** Help FAB: admin + web-desktop only (never PWA / narrow). */
export function AdminHelpLauncher({
  locale,
  launcherDict,
  catalogDict,
  catalogGroupsDict,
  toursDict,
  explainScreenDict,
  screenToursDict,
}: AdminHelpLauncherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const surface = useAppSurface();
  const idPrefix = useId().replace(/:/g, "");
  const panelId = `admin-help-chat-${idPrefix}`;
  const titleId = `${panelId}-title`;
  const descId = `${panelId}-desc`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<AdminTutorialId | null>(null);
  const [explainBusy, setExplainBusy] = useState(false);

  const screenMatch = resolveAdminScreenTour(pathname, locale);
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

  const toggleFromFab = () => {
    handleOpenChange(!open);
  };

  const startTutorial = useCallback(
    (id: AdminTutorialId) => {
      handleOpenChange(false);
      setBusyId(id);
      void startAdminTutorial({
        id,
        locale,
        pathname,
        toursDict,
        push: (href) => router.push(href),
      }).finally(() => {
        setBusyId(null);
      });
    },
    [locale, pathname, toursDict, router, handleOpenChange],
  );

  const startExplain = useCallback(() => {
    handleOpenChange(false);
    setExplainBusy(true);
    void startExplainScreenTour({
      locale,
      pathname,
      screenToursDict,
    }).finally(() => {
      setExplainBusy(false);
    });
  }, [locale, pathname, screenToursDict, handleOpenChange]);

  if (surface !== "web-desktop") {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col items-end md:bottom-8 md:right-8"
    >
      {open ? (
        <div className="pointer-events-auto">
          <AdminHelpChatPanel
            id={panelId}
            titleId={titleId}
            title={launcherDict.helpTitle}
            descriptionId={descId}
            description={launcherDict.panelDesc}
            closeLabel={launcherDict.closePanel}
            onClose={() => handleOpenChange(false)}
          >
            <AdminHelpExplainScreenBlock
              dict={explainScreenDict}
              screenTitle={screenMeta?.title ?? null}
              screenDescription={screenMeta?.description ?? null}
              available={screenMatch != null}
              busy={explainBusy}
              onStart={startExplain}
            />
            <AdminHelpTutorialList
              dict={catalogDict}
              groupsDict={catalogGroupsDict}
              onStart={startTutorial}
              busyId={busyId}
            />
          </AdminHelpChatPanel>
        </div>
      ) : null}

      <button
        type="button"
        onClick={toggleFromFab}
        aria-label={launcherDict.fabAria}
        aria-expanded={open}
        aria-controls={panelId}
        title={launcherDict.fabTitle}
        className="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-lg transition-[transform,box-shadow,background-color] duration-200 ease-out hover:scale-105 hover:bg-[var(--color-primary-dark)] hover:shadow-xl active:scale-95 active:bg-[var(--color-primary-dark)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-foreground)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-primary)] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100"
      >
        <CircleHelp className="h-5 w-5 shrink-0" aria-hidden strokeWidth={2} />
      </button>
    </div>
  );
}

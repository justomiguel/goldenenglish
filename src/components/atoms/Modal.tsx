"use client";

import { ChevronsDown, X } from "lucide-react";
import { useLayoutEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { ModalStackedScrim } from "@/components/atoms/ModalStackedScrim";
import { useScrollEdgeFades } from "@/hooks/useScrollEdgeFades";
import {
  resolveModalCloseLabel,
  resolveModalScrollMoreHint,
} from "@/lib/i18n/resolveModalCloseLabel";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titleId: string;
  descriptionId?: string;
  /** When there is no visible title, use this as the accessible name. */
  ariaLabel?: string;
  title: string;
  children: ReactNode;
  /** When true, Escape does not close the dialog (long-running work in progress). */
  disableClose?: boolean;
  /**
   * Header dismiss control (dictionary). When omitted, uses `common.modalClose`
   * for the locale inferred from the URL path. Pass `""` only to hide the header close.
   */
  closeLabel?: string;
  /** Tailwind z-index class for stacking above portaled popovers (e.g. `z-[250]`). */
  stackClassName?: string;
  /**
   * When true, opens with `show()` instead of `showModal()` so Driver.js tours can sit above
   * the dialog (native top layer would otherwise cover the tour popover).
   */
  stackBelowTour?: boolean;
  /** Extra classes on the `<dialog>` (e.g. wider modals). */
  dialogClassName?: string;
}

export function Modal({
  open,
  onOpenChange,
  titleId,
  descriptionId,
  ariaLabel,
  title,
  children,
  disableClose,
  closeLabel,
  stackClassName = "z-[100]",
  stackBelowTour = false,
  dialogClassName = "",
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const suppressCloseRef = useRef(false);
  /** Escape / light-dismiss — honor as user intent; other `close` while `open` is spurious. */
  const userDismissRef = useRef(false);
  // Derive synchronously — do not open with showModal() then demote (Driver.js race).
  const useStackedPresentation = open && stackBelowTour;
  const pathname = usePathname();
  const headerCloseLabel = resolveModalCloseLabel(closeLabel, pathname);
  const scrollMoreHint = resolveModalScrollMoreHint(pathname);
  const { scrollRef, contentRef, showTopFade, showBottomFade, onScroll } =
    useScrollEdgeFades(open);
  const showHeaderClose = Boolean(!disableClose && headerCloseLabel);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isTopLayerModal = (): boolean => {
      try {
        return el.matches(":modal");
      } catch {
        return false;
      }
    };

    /** close() fires `close`; keep suppress until after the event queue drains. */
    const reopen = (mode: "show" | "showModal") => {
      suppressCloseRef.current = true;
      if (el.open) el.close();
      if (mode === "show") el.show();
      else el.showModal();
      queueMicrotask(() => {
        suppressCloseRef.current = false;
      });
    };

    if (open) {
      if (useStackedPresentation) {
        if (isTopLayerModal()) reopen("show");
        else if (!el.open) el.show();
      } else if (!isTopLayerModal()) {
        // Already open via show() (e.g. tour ended) — leave it. Promoting with
        // close()+showModal() fires `close` and React onOpenChange(false), which
        // tears down create-cohort / create-section forms mid-flow.
        if (!el.open) el.showModal();
      }
    } else if (el.open) {
      suppressCloseRef.current = true;
      el.close();
      queueMicrotask(() => {
        suppressCloseRef.current = false;
      });
    }
  }, [open, useStackedPresentation]);

  function restoreIfStillWantedOpen() {
    const el = ref.current;
    if (!el || !open || el.open) return;
    suppressCloseRef.current = true;
    if (useStackedPresentation) el.show();
    else el.showModal();
    queueMicrotask(() => {
      suppressCloseRef.current = false;
    });
  }

  function onDialogClose() {
    if (suppressCloseRef.current) return;
    if (userDismissRef.current) {
      userDismissRef.current = false;
      onOpenChange(false);
      return;
    }
    // Spurious native close while React still wants open (tour teardown, etc.).
    if (open) {
      restoreIfStillWantedOpen();
      return;
    }
    onOpenChange(false);
  }

  function requestDismiss() {
    if (disableClose) return;
    onOpenChange(false);
  }

  return (
    <>
      {useStackedPresentation ? (
        <ModalStackedScrim onDismiss={disableClose ? null : requestDismiss} />
      ) : null}
      <dialog
        ref={ref}
        className={`fixed left-1/2 top-1/2 ${useStackedPresentation ? "ge-modal-stacked z-[100]" : stackClassName} min-w-0 max-h-[min(92dvh,calc(100dvh-2rem))] w-[calc(100%-2rem)] max-w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-surface)] p-0 text-[var(--color-foreground)] shadow-[var(--shadow-card)] ring-2 ring-[var(--color-primary)]/10 open:flex open:flex-col sm:max-w-lg md:max-w-xl lg:max-w-2xl ${useStackedPresentation ? "" : "[&::backdrop]:backdrop-blur-md [&::backdrop]:backdrop-saturate-150 [&::backdrop]:bg-[color-mix(in_srgb,var(--color-background)_72%,transparent)]"} ${dialogClassName}`}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-label={ariaLabel}
        onClose={onDialogClose}
        onCancel={(e) => {
          if (disableClose) {
            e.preventDefault();
            return;
          }
          userDismissRef.current = true;
        }}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
          <h2
            id={titleId}
            className="min-w-0 flex-1 truncate font-display text-base font-semibold leading-snug tracking-tight text-[var(--color-foreground)] sm:text-xl"
            title={title}
          >
            {title}
          </h2>
          {showHeaderClose ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label={headerCloseLabel ?? undefined}
              className="min-h-[44px] min-w-[44px] shrink-0 gap-2 self-center border border-transparent px-2.5 py-2 font-semibold text-[var(--color-foreground)] hover:bg-[var(--color-muted)] sm:min-h-[36px] sm:min-w-0 sm:px-3"
              onClick={requestDismiss}
            >
              <X className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden sm:inline">{headerCloseLabel}</span>
            </Button>
          ) : null}
        </header>
        <div className="relative flex min-h-0 flex-1 flex-col">
          {showTopFade ? (
            <div
              aria-hidden
              data-ge-modal-scroll-fade="top"
              className="pointer-events-none absolute left-0 right-0 top-0 z-[1] h-14 bg-gradient-to-b from-[var(--color-surface)] from-10% via-[color-mix(in_srgb,var(--color-foreground)_11%,var(--color-surface))] to-transparent"
            />
          ) : null}
          <div
            ref={scrollRef}
            onScroll={onScroll}
            className="modal-body-scroll flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4 @container sm:px-5 sm:py-5"
          >
            <div
              ref={contentRef}
              className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4"
            >
              {children}
            </div>
          </div>
          {showBottomFade ? (
            <div
              aria-hidden
              data-ge-modal-scroll-fade="bottom"
              className="pointer-events-none absolute bottom-0 left-0 right-0 z-[1] h-16 bg-gradient-to-t from-[var(--color-surface)] from-15% via-[color-mix(in_srgb,var(--color-foreground)_12%,var(--color-surface))] to-transparent"
            />
          ) : null}
          {showBottomFade ? (
            <div className="pointer-events-none absolute bottom-2 left-0 right-0 z-[2] flex flex-col items-center gap-1.5 px-4 text-center">
              <ChevronsDown
                className="h-6 w-6 text-[var(--color-foreground)]/[0.38]"
                strokeWidth={2.25}
                aria-hidden
              />
              <p className="max-w-sm text-xs font-medium leading-snug text-[var(--color-foreground)]/55">
                {scrollMoreHint}
              </p>
            </div>
          ) : null}
        </div>
      </dialog>
    </>
  );
}

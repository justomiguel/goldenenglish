/** Double rAF + short timeout so layout/modals settle after SPA navigation. */
export function waitForLayoutSettle(ms = 50): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(resolve, ms);
      });
    });
  });
}

/** Prefer instant scroll so Driver stage/popover are not painted mid-animation. */
export function tourScrollBehavior(): ScrollBehavior {
  if (typeof window === "undefined") return "auto";
  try {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "auto";
  } catch {
    /* ignore */
  }
  return "auto";
}

/**
 * Scrolls the highlighted tour target into a stable viewport region (center),
 * clearing sticky header / bottom FAB overlap via CSS scroll-margin on [data-tour].
 */
export function scrollTourTargetIntoView(el: Element): void {
  if (!(el instanceof HTMLElement)) return;
  if (el === document.body || el === document.documentElement) return;
  try {
    el.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: tourScrollBehavior(),
    });
  } catch {
    try {
      el.scrollIntoView(true);
    } catch {
      /* ignore */
    }
  }
}

export type TourLayoutSyncHandle = {
  refreshNow: () => void;
  /** Scroll active element into view, wait for layout, then refresh Driver. */
  alignToActiveElement: () => Promise<void>;
  dispose: () => void;
};

/**
 * Keeps Driver.js stage/popover aligned after React remounts, modal open, resize,
 * and after scrolling the highlighted target into view.
 */
export function bindTourLayoutSync(driverApi: {
  isActive: () => boolean;
  refresh: () => void;
  getActiveElement: () => Element | undefined;
  getActiveStep: () => { element?: string | Element | (() => Element) } | undefined;
}): TourLayoutSyncHandle {
  let disposed = false;
  let refreshTimer: ReturnType<typeof setTimeout> | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let aligning = false;
  let alignPromise: Promise<void> | null = null;

  const refreshNow = () => {
    if (disposed || !driverApi.isActive()) return;
    try {
      driverApi.refresh();
    } catch {
      /* ignore */
    }
  };

  const scheduleRefresh = (delayMs = 0) => {
    if (aligning) return;
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void waitForLayoutSettle(0).then(refreshNow);
    }, delayMs);
  };

  const alignToActiveElement = (): Promise<void> => {
    if (disposed || !driverApi.isActive()) return Promise.resolve();
    if (alignPromise) return alignPromise;

    alignPromise = (async () => {
      aligning = true;
      try {
        const el = driverApi.getActiveElement();
        if (el) scrollTourTargetIntoView(el);
        await waitForLayoutSettle(40);
        refreshNow();
        await waitForLayoutSettle(80);
        refreshNow();
        await waitForLayoutSettle(160);
        refreshNow();
      } finally {
        aligning = false;
        alignPromise = null;
      }
    })();

    return alignPromise;
  };

  const observeActive = () => {
    resizeObserver?.disconnect();
    const el = driverApi.getActiveElement();
    if (!el || typeof ResizeObserver === "undefined") return;
    resizeObserver = new ResizeObserver(() => scheduleRefresh(16));
    resizeObserver.observe(el);
    if (el.parentElement) resizeObserver.observe(el.parentElement);
  };

  const onHighlighted = () => {
    void alignToActiveElement().then(() => {
      observeActive();
    });
  };

  const onWin = () => scheduleRefresh(50);
  window.addEventListener("resize", onWin);
  window.addEventListener("scroll", onWin, true);

  const disconnectWatch = window.setInterval(() => {
    if (disposed || !driverApi.isActive()) return;
    const el = driverApi.getActiveElement();
    if (el && !el.isConnected) {
      scheduleRefresh(30);
      scheduleRefresh(120);
      scheduleRefresh(280);
    }
  }, 200);

  let lastEl: Element | undefined;
  const highlightWatch = window.setInterval(() => {
    if (disposed || !driverApi.isActive()) return;
    const el = driverApi.getActiveElement();
    if (el && el !== lastEl) {
      lastEl = el;
      onHighlighted();
    }
  }, 100);

  return {
    refreshNow,
    alignToActiveElement,
    dispose: () => {
      disposed = true;
      aligning = false;
      if (refreshTimer) clearTimeout(refreshTimer);
      window.clearInterval(disconnectWatch);
      window.clearInterval(highlightWatch);
      window.removeEventListener("resize", onWin);
      window.removeEventListener("scroll", onWin, true);
      resizeObserver?.disconnect();
      resizeObserver = null;
    },
  };
}

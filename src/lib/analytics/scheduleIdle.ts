/**
 * Defers work until the browser is idle (or soon after) to reduce main-thread contention
 * during hydration and route transitions — aligns with RUM / Core Web Vitals best practices.
 */
export function scheduleIdle(fn: () => void): void {
  if (typeof window === "undefined") return;
  const ric = window.requestIdleCallback;
  if (typeof ric === "function") {
    ric(() => {
      fn();
    }, { timeout: 2000 });
  } else {
    window.setTimeout(fn, 0);
  }
}

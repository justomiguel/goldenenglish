const MEASUREMENT_ID = /^G-[A-Z0-9]+$/;

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    __clGaConfigured?: string;
  }
}

/** Accept only a GA4 measurement id. Anything else stays off. */
export function readCentrolistoGaMeasurementId(raw: string | null | undefined): string | null {
  const id = raw?.trim() ?? "";
  return MEASUREMENT_ID.test(id) ? id : null;
}

/** Admin screens stay out of the marketing property. */
export function isCentrolistoMarketingPath(pathname: string): boolean {
  return !/(^|\/)admin(\/|$)/.test(pathname);
}

export interface CentrolistoClickEvent {
  linkUrl: string;
  linkText: string;
  outbound: boolean;
}

export function resolveCentrolistoClick(
  target: EventTarget | null,
  pageOrigin: string,
): CentrolistoClickEvent | null {
  if (!(target instanceof Element)) return null;
  const anchor = target.closest("a[href]");
  if (!(anchor instanceof HTMLAnchorElement)) return null;
  const linkUrl = anchor.href;
  if (!linkUrl || linkUrl.startsWith("javascript:")) return null;
  let outbound = false;
  try {
    outbound = new URL(linkUrl).origin !== pageOrigin;
  } catch {
    return null;
  }
  const linkText = (anchor.getAttribute("aria-label") || anchor.textContent || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return { linkUrl, linkText, outbound };
}

export function installCentrolistoGtag(measurementId: string): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
  }
  if (window.__clGaConfigured === measurementId) return;
  window.__clGaConfigured = measurementId;
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
}

const NAMED_EVENT = /^cl_[a-z0-9_]+$/;

/** A control can name its own event. Clicks still emit `cl_click` when they are links. */
export function readCentrolistoNamedEvent(target: EventTarget | null): { name: string; detail: string } | null {
  if (!(target instanceof Element)) return null;
  const node = target.closest("[data-cl-event]");
  if (!(node instanceof HTMLElement)) return null;
  const name = node.getAttribute("data-cl-event") ?? "";
  if (!NAMED_EVENT.test(name)) return null;
  return { name, detail: (node.getAttribute("data-cl-detail") ?? "").slice(0, 80) };
}

export function trackCentrolistoGaEvent(
  name: string,
  params: Record<string, string | boolean>,
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  if (!isCentrolistoMarketingPath(window.location.pathname)) return;
  window.gtag("event", name, params);
}

/**
 * Pure helpers to turn a raw `User-Agent` string into something an admin can scan
 * quickly: a friendly label, the vendor (when known), an optional info URL,
 * and a secondary line (browser + OS for humans, or kind for unknowns).
 *
 * Bot directory lives in {@link "./userAgentBots"} so this file stays small.
 * No DOM, no Supabase, no `isbot` here — we use our own list so we can attach
 * a vendor name and link. Safe to use on server and client.
 */

import { BOT_MATCHERS, type BotMatcher } from "./userAgentBots";

export type ParsedUserAgentKind = "bot" | "browser" | "library" | "empty" | "unknown";

export interface ParsedUserAgent {
  kind: ParsedUserAgentKind;
  /** Short human-friendly label (e.g. "Googlebot", "Chrome 120"). */
  label: string;
  /** Owner of the bot or browser engine when known (e.g. "Google"). */
  vendor: string | null;
  /** Public info page about the bot or vendor when available. */
  vendorUrl: string | null;
  /** Smaller secondary line (e.g. "Search engine", "Desktop · macOS"). */
  secondary: string | null;
}

const LIBRARY_TOKENS = [
  "curl/",
  "Wget/",
  "python-requests",
  "python-urllib",
  "Go-http-client",
  "okhttp",
  "axios",
  "node-fetch",
  "Java/",
  "PostmanRuntime",
];

function includesCi(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function detectKnownBot(ua: string): BotMatcher | null {
  for (const m of BOT_MATCHERS) {
    if (includesCi(ua, m.token)) return m;
  }
  return null;
}

function detectGenericBot(ua: string): boolean {
  return /(bot|crawler|spider|crawling|preview|fetcher|scanner|monitor|httpclient)/i.test(
    ua,
  );
}

function detectLibrary(ua: string): string | null {
  const trimmed = ua.trim();
  for (const t of LIBRARY_TOKENS) {
    if (trimmed.startsWith(t) || includesCi(trimmed, t)) {
      const slash = trimmed.indexOf("/");
      const name = slash > 0 ? trimmed.slice(0, slash) : trimmed.split(/\s/, 1)[0];
      return name || trimmed.slice(0, 24);
    }
  }
  return null;
}

interface BrowserInfo {
  name: string;
  version: string | null;
  os: string | null;
  device: "desktop" | "mobile" | "tablet" | null;
}

const OS_MATCHERS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /Windows NT 10\.0/i, name: "Windows 10/11" },
  { pattern: /Windows NT 6\.3/i, name: "Windows 8.1" },
  { pattern: /Windows NT 6\.2/i, name: "Windows 8" },
  { pattern: /Windows NT 6\.1/i, name: "Windows 7" },
  { pattern: /Windows Phone/i, name: "Windows Phone" },
  { pattern: /Android/i, name: "Android" },
  { pattern: /iPad|iPhone|iPod/i, name: "iOS" },
  { pattern: /CrOS/i, name: "ChromeOS" },
  { pattern: /Mac OS X/i, name: "macOS" },
  { pattern: /Linux/i, name: "Linux" },
];

function detectOs(ua: string): string | null {
  for (const m of OS_MATCHERS) {
    if (m.pattern.test(ua)) return m.name;
  }
  return null;
}

function detectDevice(ua: string): BrowserInfo["device"] {
  if (/iPad|Tablet/i.test(ua)) return "tablet";
  if (/Mobi|Android.+Mobile|iPhone|iPod|Phone/i.test(ua)) return "mobile";
  if (/Mozilla|Chrome|Safari|Firefox|Edg|Opera/i.test(ua)) return "desktop";
  return null;
}

const BROWSER_MATCHERS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /Edg\/(\d+(?:\.\d+)*)/i, name: "Edge" },
  { pattern: /OPR\/(\d+(?:\.\d+)*)/i, name: "Opera" },
  { pattern: /YaBrowser\/(\d+(?:\.\d+)*)/i, name: "Yandex Browser" },
  { pattern: /Vivaldi\/(\d+(?:\.\d+)*)/i, name: "Vivaldi" },
  { pattern: /SamsungBrowser\/(\d+(?:\.\d+)*)/i, name: "Samsung Internet" },
  { pattern: /CriOS\/(\d+(?:\.\d+)*)/i, name: "Chrome (iOS)" },
  { pattern: /FxiOS\/(\d+(?:\.\d+)*)/i, name: "Firefox (iOS)" },
  { pattern: /Firefox\/(\d+(?:\.\d+)*)/i, name: "Firefox" },
  { pattern: /Chrome\/(\d+(?:\.\d+)*)/i, name: "Chrome" },
  { pattern: /Version\/(\d+(?:\.\d+)*).*Safari/i, name: "Safari" },
];

function detectBrowser(ua: string): BrowserInfo | null {
  for (const m of BROWSER_MATCHERS) {
    const r = m.pattern.exec(ua);
    if (r) {
      const major = r[1]?.split(".")[0] ?? null;
      return { name: m.name, version: major, os: detectOs(ua), device: detectDevice(ua) };
    }
  }
  return null;
}

function deviceLabel(d: BrowserInfo["device"]): string | null {
  if (d === "mobile") return "Mobile";
  if (d === "tablet") return "Tablet";
  if (d === "desktop") return "Desktop";
  return null;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/**
 * Parse a raw User-Agent into a friendly summary for the admin breakdown UI.
 *
 * Order: empty → curated bot directory → generic bot heuristic →
 * CLI / library client → real browser (with major version + OS) → unknown.
 */
export function parseTrafficUserAgent(rawUa: string | null | undefined): ParsedUserAgent {
  const ua = typeof rawUa === "string" ? rawUa.trim() : "";
  if (!ua) {
    return { kind: "empty", label: "(empty)", vendor: null, vendorUrl: null, secondary: null };
  }

  const known = detectKnownBot(ua);
  if (known) {
    return {
      kind: "bot",
      label: known.label,
      vendor: known.vendor,
      vendorUrl: known.vendorUrl,
      secondary: known.category,
    };
  }

  if (detectGenericBot(ua)) {
    return { kind: "bot", label: truncate(ua, 48), vendor: null, vendorUrl: null, secondary: "bot" };
  }

  const lib = detectLibrary(ua);
  if (lib) {
    return { kind: "library", label: lib, vendor: null, vendorUrl: null, secondary: truncate(ua, 60) };
  }

  const browser = detectBrowser(ua);
  if (browser) {
    const versioned = browser.version ? `${browser.name} ${browser.version}` : browser.name;
    const tail: string[] = [];
    const dev = deviceLabel(browser.device);
    if (dev) tail.push(dev);
    if (browser.os) tail.push(browser.os);
    return {
      kind: "browser",
      label: versioned,
      vendor: null,
      vendorUrl: null,
      secondary: tail.length > 0 ? tail.join(" · ") : null,
    };
  }

  return { kind: "unknown", label: truncate(ua, 48), vendor: null, vendorUrl: null, secondary: null };
}

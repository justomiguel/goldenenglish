import { cookies, headers } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

export const VIEWER_SESSION_COOKIE = "ge_content_view_sid";
/** Forwarded on first visit so RSC can read the id before Set-Cookie is stored. */
export const GE_CONTENT_VIEW_SESSION_HEADER = "x-ge-content-view-sid";
const VIEWER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const viewerSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: VIEWER_SESSION_MAX_AGE_SECONDS,
};

export function buildContentViewSessionKey(
  locale: string,
  slug: string,
  viewerSessionId: string,
): string {
  return `${locale}:${slug}:${viewerSessionId}`;
}

function readViewerSessionIdFromRequest(request: NextRequest): string | null {
  const fromCookie = request.cookies.get(VIEWER_SESSION_COOKIE)?.value?.trim();
  if (fromCookie) return fromCookie;
  const fromHeader = request.headers.get(GE_CONTENT_VIEW_SESSION_HEADER)?.trim();
  return fromHeader || null;
}

/** Middleware: assign a stable viewer id for this request (header) when the cookie is absent. */
export function resolveContentViewViewerSessionOnRequest(request: NextRequest): string {
  const existing = readViewerSessionIdFromRequest(request);
  if (existing) return existing;

  const viewerSessionId = crypto.randomUUID();
  request.headers.set(GE_CONTENT_VIEW_SESSION_HEADER, viewerSessionId);
  return viewerSessionId;
}

/** Middleware: persist the first-visit viewer id on the response. */
export function syncContentViewViewerSessionCookie(
  request: NextRequest,
  response: NextResponse,
): void {
  if (request.cookies.get(VIEWER_SESSION_COOKIE)?.value?.trim()) return;

  const viewerSessionId = request.headers.get(GE_CONTENT_VIEW_SESSION_HEADER)?.trim();
  if (!viewerSessionId) return;

  response.cookies.set(VIEWER_SESSION_COOKIE, viewerSessionId, viewerSessionCookieOptions);
}

/** Server Components: read-only access to the per-browser viewer session id. */
export async function getContentViewViewerSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(VIEWER_SESSION_COOKIE)?.value?.trim();
  if (fromCookie) return fromCookie;

  const headerStore = await headers();
  const fromHeader = headerStore.get(GE_CONTENT_VIEW_SESSION_HEADER)?.trim();
  if (fromHeader) return fromHeader;

  return crypto.randomUUID();
}

"use client";

import { createBrowserClient } from "@supabase/ssr";
import { parse, serialize, type SerializeOptions } from "cookie";
import { readSupabasePublicEnv } from "@/lib/supabase/publicEnv";

const STORAGE_KEY = "ge_auth_remember";

/** GoTrue cookie lifetime cap (days) — matches @supabase/ssr default. */
const MAX_AGE_REMEMBER_SEC = 400 * 24 * 60 * 60;
/** Without “remember me”: session ends when the cookie expires (here: 7 days). */
const MAX_AGE_BRIEF_SEC = 7 * 24 * 60 * 60;

export function getRememberMePreference(): boolean {
  if (typeof window === "undefined") return true;
  const v = window.localStorage.getItem(STORAGE_KEY);
  if (v === null) return true;
  return v === "1";
}

export function setRememberMePreference(remember: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, remember ? "1" : "0");
}

function browserCookieMethods() {
  return {
    getAll() {
      return Object.entries(parse(document.cookie)).map(([name, value]) => ({
        name,
        value: value ?? "",
      }));
    },
    setAll(
      cookiesToSet: { name: string; value: string; options?: SerializeOptions }[],
    ) {
      const remember = getRememberMePreference();
      for (const { name, value, options: raw } of cookiesToSet) {
        const incoming = { ...(raw ?? {}) } as SerializeOptions & {
          name?: string;
        };
        delete incoming.name;
        const base: SerializeOptions = {
          path: "/",
          sameSite: "lax",
          ...incoming,
        };
        const isDelete = !value || incoming?.maxAge === 0;
        const maxAge = isDelete
          ? 0
          : remember
            ? MAX_AGE_REMEMBER_SEC
            : MAX_AGE_BRIEF_SEC;
        document.cookie = serialize(name, value, { ...base, maxAge });
      }
    },
  };
}

export function createClient() {
  const { url, anonKey } = readSupabasePublicEnv();
  return createBrowserClient(url, anonKey, {
    cookies: browserCookieMethods(),
  });
}

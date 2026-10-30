"use client";

import { createBrowserClient } from "@supabase/ssr";

type PulsarPublicBag = { url?: string; anonKey?: string };

/** Browser auth for Centro Listo. Uses the Pulsar project injected on these pages. */
export function createPulsarBrowserClient() {
  const injected = (window as Window & { __GE_TENANT_PUBLIC__?: PulsarPublicBag })
    .__GE_TENANT_PUBLIC__;
  const url = injected?.url?.trim() ?? "";
  const anonKey = injected?.anonKey?.trim() ?? "";
  if (!url || !anonKey) {
    throw new Error("Missing Pulsar public Supabase env");
  }
  return createBrowserClient(url, anonKey);
}

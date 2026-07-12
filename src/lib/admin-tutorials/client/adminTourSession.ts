"use client";

import { useSyncExternalStore } from "react";

let active = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function setAdminTourSessionActive(next: boolean): void {
  if (active === next) return;
  active = next;
  emit();
}

export function isAdminTourSessionActive(): boolean {
  return active;
}

export function subscribeAdminTourSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAdminTourSessionActive(): boolean {
  return useSyncExternalStore(subscribeAdminTourSession, isAdminTourSessionActive, () => false);
}

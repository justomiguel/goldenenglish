"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  clearRegisterDniDraft,
  readRegisterDniDraft,
  registerDniDraftKey,
  writeRegisterDniDraft,
  type RegisterDniDraft,
  type RegisterDniDraftStep,
} from "@/lib/register/registerDniDraft";

const EMPTY: RegisterDniDraft = { dni: "", step: "dni" };

const listeners = new Set<() => void>();
const snapshotCache = new Map<string, { raw: string | null; draft: RegisterDniDraft }>();

function emitDraftChange(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
}

function storedRaw(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function draftSnapshot(key: string): RegisterDniDraft {
  const raw = storedRaw(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.draft;
  const draft = readRegisterDniDraft(key) ?? EMPTY;
  snapshotCache.set(key, { raw, draft });
  return draft;
}

export function useRegisterDniDraft(locale: string, intent: string) {
  const key = registerDniDraftKey(locale, intent);
  const draft = useSyncExternalStore(subscribe, () => draftSnapshot(key), () => EMPTY);

  const setDni = useCallback((value: string) => {
    const current = draftSnapshot(key);
    writeRegisterDniDraft(key, { dni: value, step: current.step });
    snapshotCache.delete(key);
    emitDraftChange();
  }, [key]);

  const setStep = useCallback((value: RegisterDniDraftStep) => {
    const current = draftSnapshot(key);
    writeRegisterDniDraft(key, { dni: current.dni, step: value });
    snapshotCache.delete(key);
    emitDraftChange();
  }, [key]);

  const clearDraft = useCallback(() => {
    clearRegisterDniDraft(key);
    snapshotCache.delete(key);
    emitDraftChange();
  }, [key]);

  return { dni: draft.dni, setDni, step: draft.step, setStep, clearDraft };
}

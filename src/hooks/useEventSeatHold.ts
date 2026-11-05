"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { EventSeatMapConfig } from "@/lib/events/seatMapModel";
import { trackEvent } from "@/lib/analytics/trackClient";
import { diffLostSeatSelection } from "@/lib/events/diffLostSeatSelection";
import { suggestNearbyFreeSeats } from "@/lib/events/suggestNearbyFreeSeats";
import type { EventSeatLockSnapshot } from "@/lib/events/seatMapState";

const HOLD_KEY_PREFIX = "ge:event-seat-hold:";
const POLL_MS = 15_000;
const RENEW_MS = 4 * 60_000;

interface SeatSnapshot {
  locks: EventSeatLockSnapshot[];
  heldByOthers: string[];
  expiresAt: string | null;
}

const tokenByEvent = new Map<string, string>();

function readToken(eventId: string): string {
  const key = `${HOLD_KEY_PREFIX}${eventId}`;
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const next = crypto.randomUUID();
    sessionStorage.setItem(key, next);
    return next;
  } catch {
    return crypto.randomUUID();
  }
}

function holdTokenSnapshot(eventId: string): string {
  const key = `${HOLD_KEY_PREFIX}${eventId}`;
  const cached = tokenByEvent.get(eventId);
  if (cached) {
    try {
      if (sessionStorage.getItem(key) !== cached) sessionStorage.setItem(key, cached);
    } catch {
      /* storage can be blocked */
    }
    return cached;
  }
  const next = readToken(eventId);
  tokenByEvent.set(eventId, next);
  return next;
}

function emptyHoldToken(): string {
  return "";
}

function subscribeHoldToken(): () => void {
  return () => {};
}

export function useEventSeatHold(input: {
  enabled: boolean;
  slug: string;
  eventId: string;
  locale: string;
  config: EventSeatMapConfig | null;
  requiredCount: number;
  initialLocks: readonly EventSeatLockSnapshot[];
  selectedSeatKeys: readonly string[];
  onSelectedSeatKeysChange: (next: string[]) => void;
}) {
  const token = useSyncExternalStore(
    subscribeHoldToken,
    () => (input.enabled ? holdTokenSnapshot(input.eventId) : ""),
    emptyHoldToken,
  );
  const [snapshot, setSnapshot] = useState<SeatSnapshot>({
    locks: [...input.initialLocks],
    heldByOthers: [],
    expiresAt: null,
  });
  const [lostSeatKeys, setLostSeatKeys] = useState<string[]>([]);
  const [holdFailed, setHoldFailed] = useState(false);
  const selectedRef = useRef(input.selectedSeatKeys);
  useEffect(() => {
    selectedRef.current = input.selectedSeatKeys;
  }, [input.selectedSeatKeys]);

  function applyLoss(unavailable: readonly string[]) {
    const diff = diffLostSeatSelection({
      selectedSeatKeys: selectedRef.current,
      unavailableSeatKeys: unavailable,
    });
    if (diff.lost.length === 0) return;
    input.onSelectedSeatKeysChange(diff.kept);
    setLostSeatKeys(diff.lost);
    trackEvent("action", `event:${input.eventId}`, { kind: "seat_lost", seatCount: diff.lost.length });
  }

  function reportTaken(keys: readonly string[]) {
    applyLoss(keys);
  }

  useEffect(() => {
    if (!input.enabled || !token) return;
    let stop = false;
    const headers = { "x-seat-hold-token": token };

    async function poll() {
      if (document.visibilityState === "hidden") return;
      const response = await fetch(`/api/events/${input.slug}/seats?locale=${input.locale}`, { headers });
      const body = (await response.json().catch(() => null)) as SeatSnapshot | null;
      if (stop || !response.ok || !body) return;
      const locks = Array.isArray(body.locks) ? body.locks : [];
      const heldByOthers = Array.isArray(body.heldByOthers) ? body.heldByOthers : [];
      setSnapshot({ locks, heldByOthers, expiresAt: body.expiresAt ?? null });
      const locked = locks.map((lock) => lock.seatKey);
      applyLoss([...locked, ...heldByOthers]);
    }

    const pollTimer = window.setInterval(() => void poll(), POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    void poll();
    return () => {
      stop = true;
      window.clearInterval(pollTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [input.enabled, input.eventId, input.locale, input.slug, token]);

  useEffect(() => {
    if (!input.enabled || !token) return;
    const keys = input.selectedSeatKeys;
    const timer = window.setTimeout(() => {
      void fetch(`/api/events/${input.slug}/seats/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-seat-hold-token": token },
        body: JSON.stringify({ locale: input.locale, token, seatKeys: keys }),
      })
        .then(async (response) => {
          const body = (await response.json().catch(() => null)) as {
            takenSeatKeys?: string[];
            expiresAt?: string | null;
            code?: string;
          } | null;
          if (!response.ok) {
            setHoldFailed(true);
            if (body?.takenSeatKeys?.length) applyLoss(body.takenSeatKeys);
            return;
          }
          setHoldFailed(false);
          if (body?.expiresAt) setSnapshot((current) => ({ ...current, expiresAt: body.expiresAt ?? null }));
          if (body?.takenSeatKeys?.length) applyLoss(body.takenSeatKeys);
        })
        .catch(() => setHoldFailed(true));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [input.enabled, input.locale, input.selectedSeatKeys, input.slug, token]);

  useEffect(() => {
    if (!input.enabled || !token || input.selectedSeatKeys.length === 0) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void fetch(`/api/events/${input.slug}/seats/hold`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-seat-hold-token": token },
        body: JSON.stringify({ locale: input.locale, token, seatKeys: selectedRef.current }),
      });
    }, RENEW_MS);
    return () => window.clearInterval(timer);
  }, [input.enabled, input.locale, input.selectedSeatKeys.length, input.slug, token]);

  const suggestions =
    input.config && lostSeatKeys.length > 0
      ? suggestNearbyFreeSeats({
          config: input.config,
          locks: snapshot.locks,
          heldByOthers: snapshot.heldByOthers,
          lostSeatKeys,
          neededCount: lostSeatKeys.length,
        })
      : [];

  return {
    token,
    locks: snapshot.locks,
    heldByOthers: snapshot.heldByOthers,
    expiresAt: snapshot.expiresAt,
    lostSeatKeys,
    suggestions,
    holdFailed,
    reportTaken,
    acknowledgeLost: () => setLostSeatKeys([]),
    useSuggestions: () => {
      const next = [...selectedRef.current, ...suggestions].slice(0, input.requiredCount);
      input.onSelectedSeatKeysChange(next);
      setLostSeatKeys([]);
    },
  };
}

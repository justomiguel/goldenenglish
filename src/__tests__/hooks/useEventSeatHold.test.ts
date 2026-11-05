/** @vitest-environment jsdom */
import { renderHook, act, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useEventSeatHold } from "@/hooks/useEventSeatHold";

vi.mock("@/lib/analytics/trackClient", () => ({ trackEvent: vi.fn() }));

const config = {
  enabled: true,
  floors: [
    {
      id: "f1",
      name: "Platea",
      order: 0,
      guideImageUrl: null,
      stage: { x: 0, y: 0, width: 10, height: 10, label: "STAGE" },
      blocks: [
        {
          id: "b1",
          label: "Main",
          x: 0,
          y: 20,
          width: 80,
          height: 40,
          rows: 1,
          cols: 2,
          startRowLabel: "A",
          startSeatNumber: 1,
          hiddenSeats: [],
          reservedSeats: [],
        },
      ],
    },
  ],
};

describe("useEventSeatHold", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("drops a selected seat when the poll says another buyer holds it", async () => {
    const onSelectedSeatKeysChange = vi.fn();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/seats/hold")) {
          return { ok: true, json: async () => ({ takenSeatKeys: [], expiresAt: null }) };
        }
        return {
          ok: true,
          json: async () => ({
            locks: [],
            heldByOthers: ["f1:b1:0:0"],
            expiresAt: null,
          }),
        };
      }),
    );

    renderHook(() =>
      useEventSeatHold({
        enabled: true,
        slug: "gala",
        eventId: "ev-1",
        locale: "es",
        config,
        requiredCount: 1,
        initialLocks: [],
        selectedSeatKeys: ["f1:b1:0:0"],
        onSelectedSeatKeysChange,
      }),
    );

    await waitFor(() => {
      expect(onSelectedSeatKeysChange).toHaveBeenCalledWith([]);
    });
  });

  it("stores one token for the event", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ locks: [], heldByOthers: [] }) })));
    renderHook(() =>
      useEventSeatHold({
        enabled: true,
        slug: "gala",
        eventId: "ev-1",
        locale: "es",
        config,
        requiredCount: 1,
        initialLocks: [],
        selectedSeatKeys: [],
        onSelectedSeatKeysChange: vi.fn(),
      }),
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(sessionStorage.getItem("ge:event-seat-hold:ev-1")).toMatch(
      /^[0-9a-f-]{36}$/i,
    );
  });
});

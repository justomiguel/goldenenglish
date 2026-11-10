/** @vitest-environment node */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { EventSeatMapConfig } from "@/lib/events/seatMapModel";

const config: EventSeatMapConfig = {
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
          width: 40,
          height: 20,
          rows: 1,
          cols: 1,
          startRowLabel: "A",
          startSeatNumber: 1,
          hiddenSeats: [],
          reservedSeats: [],
        },
      ],
    },
  ],
};

const { holdEventSeats, loadEventSeatHoldRows, loadEventSeatLocks } = vi.hoisted(() => ({
  holdEventSeats: vi.fn(),
  loadEventSeatHoldRows: vi.fn(async () => ({ heldByOthers: [], myHolds: [], expiresAt: null })),
  loadEventSeatLocks: vi.fn(async () => []),
}));

vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: async () => ({}) }));
vi.mock("@/lib/events/server/openPublishedEvent", () => ({
  openPublishedEvent: async () => ({
    event: {
      id: "ev-1",
      seatMapConfig: config,
      allowMultipleTickets: false,
      maxTicketsPerRegistration: 1,
    },
    client: {},
    entryHostSlug: null,
  }),
}));
vi.mock("@/lib/events/server/eventSeatLocksServer", () => ({ loadEventSeatLocks }));
vi.mock("@/lib/events/server/eventSeatHoldsServer", () => ({
  holdEventSeats,
  loadEventSeatHoldRows,
  releaseEventSeatHolds: vi.fn(),
}));
vi.mock("@/lib/logging/serverActionLog", () => ({
  logServerException: vi.fn(),
  logServerWarn: vi.fn(),
}));

import { GET } from "@/app/api/events/[slug]/seats/route";
import { POST } from "@/app/api/events/[slug]/seats/hold/route";

const token = "11111111-1111-4111-8111-111111111111";

describe("event seat routes", () => {
  beforeEach(() => {
    holdEventSeats.mockReset();
    holdEventSeats.mockResolvedValue({ ok: true, held: ["f1:b1:0:0"], taken: [], expiresAt: null });
  });

  it("returns seat state with a private cache", async () => {
    const response = await GET(new Request("http://localhost/api/events/gala/seats"), {
      params: Promise.resolve({ slug: "gala" }),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(loadEventSeatLocks).toHaveBeenCalled();
  });

  it("rejects a hold token that is not a uuid", async () => {
    const response = await POST(
      new Request("http://localhost/api/events/gala/seats/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "nope", seatKeys: ["f1:b1:0:0"] }),
      }),
      { params: Promise.resolve({ slug: "gala" }) },
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: "invalid_token" });
    expect(response.headers.get("Cache-Control")).toContain("private");
  });

  it("holds a purchasable seat", async () => {
    const response = await POST(
      new Request("http://localhost/api/events/gala/seats/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-seat-hold-token": token },
        body: JSON.stringify({ seatKeys: ["f1:b1:0:0"] }),
      }),
      { params: Promise.resolve({ slug: "gala" }) },
    );
    expect(response.status).toBe(200);
    expect(holdEventSeats).toHaveBeenCalled();
  });
});

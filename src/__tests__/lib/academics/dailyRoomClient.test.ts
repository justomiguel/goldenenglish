import { beforeEach, describe, expect, it, vi } from "vitest";
import { createFetchDailyRoomClient } from "@/lib/academics/dailyRoomClient";

describe("createFetchDailyRoomClient", () => {
  const fetchImpl = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchImpl.mockReset();
  });

  // REGRESSION CHECK: Daily calls must stay private rooms with knocking off
  // and Bearer auth. A later task issues tokens from this same client.
  it("creates a private room and returns the Daily url", async () => {
    fetchImpl.mockResolvedValue(
      new Response(JSON.stringify({ url: "https://academia.daily.co/sroom" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const client = createFetchDailyRoomClient(fetchImpl);
    const result = await client.createPrivateRoom({
      apiKey: "test-key",
      roomName: "s" + "a".repeat(32),
    });
    expect(result).toEqual({ ok: true, url: "https://academia.daily.co/sroom" });
    expect(fetchImpl).toHaveBeenCalledWith("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "s" + "a".repeat(32),
        privacy: "private",
        properties: { enable_knocking: false },
      }),
    });
  });

  it("returns daily_failed when createPrivateRoom is not ok", async () => {
    fetchImpl.mockResolvedValue(new Response("no", { status: 500 }));
    const client = createFetchDailyRoomClient(fetchImpl);
    await expect(
      client.createPrivateRoom({ apiKey: "test-key", roomName: "sroom" }),
    ).resolves.toEqual({ ok: false, code: "daily_failed" });
  });

  it("returns daily_failed when createPrivateRoom json has no url", async () => {
    fetchImpl.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const client = createFetchDailyRoomClient(fetchImpl);
    await expect(
      client.createPrivateRoom({ apiKey: "test-key", roomName: "sroom" }),
    ).resolves.toEqual({ ok: false, code: "daily_failed" });
  });

  it("deletes a room by name", async () => {
    fetchImpl.mockResolvedValue(new Response(null, { status: 200 }));
    const client = createFetchDailyRoomClient(fetchImpl);
    const result = await client.deleteRoom({
      apiKey: "test-key",
      roomName: "sroom",
    });
    expect(result).toEqual({ ok: true });
    expect(fetchImpl).toHaveBeenCalledWith("https://api.daily.co/v1/rooms/sroom", {
      method: "DELETE",
      headers: expect.objectContaining({
        Authorization: "Bearer test-key",
      }),
    });
  });

  it("returns daily_failed when deleteRoom is not ok", async () => {
    fetchImpl.mockResolvedValue(new Response("no", { status: 404 }));
    const client = createFetchDailyRoomClient(fetchImpl);
    await expect(
      client.deleteRoom({ apiKey: "test-key", roomName: "sroom" }),
    ).resolves.toEqual({ ok: false, code: "daily_failed" });
  });

  it("creates a meeting token with room and owner properties", async () => {
    fetchImpl.mockResolvedValue(
      new Response(JSON.stringify({ token: "tok-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const client = createFetchDailyRoomClient(fetchImpl);
    const result = await client.createMeetingToken({
      apiKey: "test-key",
      roomName: "sroom",
      expUnix: 1_735_000_000,
      isOwner: true,
      userName: "Ana",
    });
    expect(result).toEqual({ ok: true, token: "tok-1" });
    expect(fetchImpl).toHaveBeenCalledWith("https://api.daily.co/v1/meeting-tokens", {
      method: "POST",
      headers: {
        Authorization: "Bearer test-key",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          room_name: "sroom",
          exp: 1_735_000_000,
          is_owner: true,
          user_name: "Ana",
        },
      }),
    });
  });

  it("returns daily_failed when createMeetingToken json has no token", async () => {
    fetchImpl.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const client = createFetchDailyRoomClient(fetchImpl);
    await expect(
      client.createMeetingToken({
        apiKey: "test-key",
        roomName: "sroom",
        expUnix: 1,
        isOwner: false,
        userName: "Luis",
      }),
    ).resolves.toEqual({ ok: false, code: "daily_failed" });
  });
});

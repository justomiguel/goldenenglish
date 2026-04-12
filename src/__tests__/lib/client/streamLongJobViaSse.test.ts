/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from "vitest";
import { streamLongJobViaSse } from "@/lib/client/streamLongJobViaSse";

describe("streamLongJobViaSse", () => {
  const Original = globalThis.EventSource;

  afterEach(() => {
    globalThis.EventSource = Original;
  });

  it("rejects when EventSource is missing", async () => {
    // @ts-expect-error — entorno sin EventSource
    globalThis.EventSource = undefined;
    await expect(
      streamLongJobViaSse({
        jobId: "j1",
        streamUrl: () => "/api/x",
        onTick: vi.fn(),
        isTerminal: () => false,
      }),
    ).rejects.toThrow("event_source_unsupported");
  });

  it("resolves when a terminal snapshot arrives", async () => {
    const onTick = vi.fn();
    const mockInstance: {
      onmessage: ((ev: MessageEvent) => void) | null;
      onerror: ((ev: Event) => void) | null;
      close: ReturnType<typeof vi.fn>;
    } = {
      onmessage: null,
      onerror: null,
      close: vi.fn(),
    };

    vi.stubGlobal(
      "EventSource",
      vi.fn(function MockEventSource() {
        return mockInstance;
      }) as unknown as typeof EventSource,
    );

    const p = streamLongJobViaSse({
      jobId: "j1",
      streamUrl: (id) => `/stream/${id}`,
      onTick,
      isTerminal: (s) => s.status === "done",
    });

    expect(EventSource).toHaveBeenCalledWith("/stream/j1");
    expect(mockInstance.onmessage).toBeTypeOf("function");

    mockInstance.onmessage?.({
      data: JSON.stringify({ status: "running", current: 1, total: 10 }),
    } as MessageEvent);
    expect(onTick).toHaveBeenCalledTimes(1);

    mockInstance.onmessage?.({
      data: JSON.stringify({ status: "done", current: 10, total: 10 }),
    } as MessageEvent);

    await expect(p).resolves.toEqual(
      expect.objectContaining({ status: "done", current: 10, total: 10 }),
    );
    expect(mockInstance.close).toHaveBeenCalled();
  });

  it("rejects when message payload is invalid JSON", async () => {
    const mockInstance: {
      onmessage: ((ev: MessageEvent) => void) | null;
      onerror: ((ev: Event) => void) | null;
      close: ReturnType<typeof vi.fn>;
    } = {
      onmessage: null,
      onerror: null,
      close: vi.fn(),
    };
    vi.stubGlobal(
      "EventSource",
      vi.fn(function MockEventSource() {
        return mockInstance;
      }) as unknown as typeof EventSource,
    );
    const p = streamLongJobViaSse({
      jobId: "j1",
      streamUrl: () => "/s",
      onTick: vi.fn(),
      isTerminal: () => false,
    });
    mockInstance.onmessage?.({ data: "not-json{" } as MessageEvent);
    await expect(p).rejects.toThrow();
  });

  it("resolves last snapshot on error when already terminal", async () => {
    const lastSnap = { status: "done" as const, current: 2, total: 2 };
    const mockInstance: {
      onmessage: ((ev: MessageEvent) => void) | null;
      onerror: ((ev: Event) => void) | null;
      close: ReturnType<typeof vi.fn>;
    } = {
      onmessage: null,
      onerror: null,
      close: vi.fn(),
    };
    vi.stubGlobal(
      "EventSource",
      vi.fn(function MockEventSource() {
        return mockInstance;
      }) as unknown as typeof EventSource,
    );
    const p = streamLongJobViaSse({
      jobId: "j1",
      streamUrl: () => "/s",
      onTick: vi.fn(),
      isTerminal: (s) => s.status === "done",
    });
    mockInstance.onmessage?.({
      data: JSON.stringify(lastSnap),
    } as MessageEvent);
    mockInstance.onerror?.({} as Event);
    await expect(p).resolves.toEqual(expect.objectContaining(lastSnap));
  });

  it("rejects on connection error when snapshot not terminal", async () => {
    const mockInstance: {
      onmessage: ((ev: MessageEvent) => void) | null;
      onerror: ((ev: Event) => void) | null;
      close: ReturnType<typeof vi.fn>;
    } = {
      onmessage: null,
      onerror: null,
      close: vi.fn(),
    };
    vi.stubGlobal(
      "EventSource",
      vi.fn(function MockEventSource() {
        return mockInstance;
      }) as unknown as typeof EventSource,
    );
    const p = streamLongJobViaSse({
      jobId: "j1",
      streamUrl: () => "/s",
      onTick: vi.fn(),
      isTerminal: () => false,
    });
    mockInstance.onmessage?.({
      data: JSON.stringify({ status: "running", current: 1, total: 2 }),
    } as MessageEvent);
    mockInstance.onerror?.({} as Event);
    await expect(p).rejects.toThrow("sse_connection_error");
  });
});

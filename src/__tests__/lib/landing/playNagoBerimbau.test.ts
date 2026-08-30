import { describe, expect, it, vi } from "vitest";
import { playNagoBerimbauSignature } from "@/lib/landing/playNagoBerimbau";

describe("playNagoBerimbauSignature", () => {
  it("builds a short plucked signature and closes the audio context", () => {
    const connect = vi.fn();
    const start = vi.fn();
    const stop = vi.fn();
    const close = vi.fn().mockResolvedValue(undefined);
    const setValueAtTime = vi.fn();
    const exponentialRampToValueAtTime = vi.fn();

    const gain = {
      gain: { setValueAtTime, exponentialRampToValueAtTime },
      connect,
    };
    const filter = {
      type: "",
      frequency: { setValueAtTime, exponentialRampToValueAtTime },
      Q: { value: 0 },
      connect,
    };
    const osc = { type: "", frequency: { setValueAtTime, exponentialRampToValueAtTime }, connect, start, stop };
    const noise = { buffer: null as AudioBuffer | null, connect, start };
    const buffer = {
      getChannelData: () => new Float32Array(8),
    };

    vi.stubGlobal(
      "AudioContext",
      vi.fn(() => ({
        currentTime: 0,
        sampleRate: 44100,
        destination: {},
        createGain: () => gain,
        createBiquadFilter: () => filter,
        createOscillator: () => osc,
        createBufferSource: () => noise,
        createBuffer: () => buffer,
        close,
      })),
    );
    vi.useFakeTimers();

    playNagoBerimbauSignature();

    expect(start).toHaveBeenCalled();
    expect(stop).toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(close).toHaveBeenCalled();
    vi.useRealTimers();
  });
});

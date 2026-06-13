import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { usePwaInstallPrompt } from "@/hooks/usePwaInstallPrompt";

describe("usePwaInstallPrompt", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows prompt after beforeinstallprompt", async () => {
    const { result } = renderHook(() => usePwaInstallPrompt());
    const event = new Event("beforeinstallprompt") as Event & {
      preventDefault: () => void;
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "dismissed" }>;
    };
    event.preventDefault = vi.fn();
    event.prompt = vi.fn().mockResolvedValue(undefined);
    event.userChoice = Promise.resolve({ outcome: "dismissed" });

    act(() => {
      window.dispatchEvent(event);
    });

    await waitFor(() => expect(result.current.visible).toBe(true));
    expect(result.current.deferred).toBeTruthy();
  });

  it("dismiss persists to localStorage", async () => {
    const { result } = renderHook(() => usePwaInstallPrompt());
    act(() => result.current.dismiss());
    expect(window.localStorage.getItem("ge_pwa_install_prompt_dismissed")).toBe("1");
    expect(result.current.visible).toBe(false);
  });

  it("install runs prompt and dismisses", async () => {
    const { result } = renderHook(() => usePwaInstallPrompt());
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt") as Event & {
      preventDefault: () => void;
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted" }>;
    };
    event.preventDefault = vi.fn();
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: "accepted" });

    act(() => {
      window.dispatchEvent(event);
    });
    await waitFor(() => expect(result.current.deferred).toBeTruthy());

    await act(async () => {
      await result.current.install();
    });

    expect(prompt).toHaveBeenCalled();
    expect(result.current.visible).toBe(false);
  });

  it("skips when already standalone", () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as MediaQueryList);

    const { result } = renderHook(() => usePwaInstallPrompt());
    expect(result.current.visible).toBe(false);
  });
});

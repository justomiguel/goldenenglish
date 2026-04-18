// REGRESSION CHECK: Initial coverage for useResetPassword. Critical invariants:
//  - the hook calls exchangeCodeForSession exactly once with the URL code,
//  - rejects empty / short / mismatched passwords without hitting Supabase,
//  - emits the password_reset_completed analytics action on success.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const exchangeCodeForSession = vi.fn();
const updateUser = vi.fn();
const trackEvent = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      exchangeCodeForSession: (...a: unknown[]) =>
        exchangeCodeForSession(...a),
      updateUser: (...a: unknown[]) => updateUser(...a),
    },
  }),
}));

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: (...a: unknown[]) => trackEvent(...a),
}));

const errors = {
  missingCode: "missing code",
  expiredLink: "expired link",
  passwordRequired: "password required",
  passwordTooShort: "password too short",
  passwordMismatch: "password mismatch",
  updateFailed: "update failed",
  generic: "generic",
};

const ORIGINAL_HREF = "http://localhost/";

function setLocation(href: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL(href),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  exchangeCodeForSession.mockReset();
  updateUser.mockReset();
  trackEvent.mockReset();
  setLocation(ORIGINAL_HREF);
});

import { useResetPassword } from "@/hooks/useResetPassword";

describe("useResetPassword", () => {
  it("marks the link invalid when there is no code in the URL", async () => {
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("invalid"));
    expect(result.current.error).toBe("missing code");
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("calls exchangeCodeForSession with the code from the query string", async () => {
    setLocation("http://localhost/es/reset-password?code=abc123");
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    expect(exchangeCodeForSession).toHaveBeenCalledWith("abc123");
  });

  it("falls back to invalid when exchangeCodeForSession returns an error", async () => {
    setLocation("http://localhost/es/reset-password?code=bad");
    exchangeCodeForSession.mockResolvedValue({
      data: null,
      error: { message: "expired" },
    });
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("invalid"));
    expect(result.current.error).toBe("expired link");
  });

  it("rejects submit when password is empty", async () => {
    setLocation("http://localhost/es/reset-password?code=abc");
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("password required");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects submit when password is too short", async () => {
    setLocation("http://localhost/es/reset-password?code=abc");
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    act(() => {
      result.current.setPassword("short");
      result.current.setConfirm("short");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("password too short");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("rejects submit when passwords do not match", async () => {
    setLocation("http://localhost/es/reset-password?code=abc");
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    act(() => {
      result.current.setPassword("longenough");
      result.current.setConfirm("different00");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("password mismatch");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("emits the analytics event and marks success on update", async () => {
    setLocation("http://localhost/es/reset-password?code=abc");
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
    updateUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    act(() => {
      result.current.setPassword("longenough1");
      result.current.setConfirm("longenough1");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(updateUser).toHaveBeenCalledWith({ password: "longenough1" });
    expect(trackEvent).toHaveBeenCalledWith(
      "action",
      "auth:password_reset_completed",
      {},
    );
    expect(result.current.success).toBe(true);
  });

  it("surfaces updateUser failure and does not mark success", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setLocation("http://localhost/es/reset-password?code=abc");
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
    updateUser.mockResolvedValue({
      data: null,
      error: { message: "boom", code: "x" },
    });
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    act(() => {
      result.current.setPassword("longenough1");
      result.current.setConfirm("longenough1");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("update failed");
    expect(result.current.success).toBe(false);
    consoleSpy.mockRestore();
  });

  it("blocks submit when the link is not ready", async () => {
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("invalid"));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("expired link");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("reads the code from the URL hash when not in the query string", async () => {
    setLocation("http://localhost/es/reset-password#code=fromhash");
    exchangeCodeForSession.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    expect(exchangeCodeForSession).toHaveBeenCalledWith("fromhash");
  });

  it("logs and shows expiredLink when exchangeCodeForSession throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    setLocation("http://localhost/es/reset-password?code=abc");
    exchangeCodeForSession.mockRejectedValue(new Error("network"));
    const { result } = renderHook(() =>
      useResetPassword({ locale: "es", errors, skipRedirect: true }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("invalid"));
    expect(result.current.error).toBe("expired link");
    consoleSpy.mockRestore();
  });
});

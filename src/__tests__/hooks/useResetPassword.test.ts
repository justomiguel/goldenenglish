// REGRESSION CHECK: Critical invariants:
//  - legacy `code` on /{locale}/reset-password redirects through /api/auth/recovery-callback,
//  - token_hash + recovery uses verifyOtp,
//  - established session uses getSession (initializePromise resolved internally),
//  - submit still validates password and calls updateUser.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

const getSession = vi.fn();
const verifyOtp = vi.fn();
const setSession = vi.fn();
const updateUser = vi.fn();
const trackEvent = vi.fn();
const clearMustChangeFlag = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession,
      verifyOtp,
      setSession,
      updateUser: (...a: unknown[]) => updateUser(...a),
    },
  }),
}));

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: (...a: unknown[]) => trackEvent(...a),
}));

vi.mock("@/app/[locale]/reset-password/clearMustChangePasswordAction", () => ({
  clearMustChangePasswordFlagAction: (...a: unknown[]) => clearMustChangeFlag(...a),
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

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockReset();
  verifyOtp.mockReset();
  setSession.mockReset();
  updateUser.mockReset();
  trackEvent.mockReset();
  clearMustChangeFlag.mockReset();
  clearMustChangeFlag.mockResolvedValue({ ok: true });
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      href: "http://localhost/",
      pathname: "/",
      replace: vi.fn(),
      assign: vi.fn(),
    },
  });
});

import { useResetPassword } from "@/hooks/useResetPassword";

function setWindowLocation(href: string) {
  const url = new URL(href);
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      href,
      pathname: url.pathname,
      replace: vi.fn(),
      assign: vi.fn(),
    },
  });
}

describe("useResetPassword", () => {
  it("marks invalid with missingCode when there is no session and no auth params", async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    setWindowLocation("http://localhost/es/reset-password");
    const { result } = renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
        skipRecoveryCodeRedirect: true,
      }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("invalid"));
    expect(result.current.error).toBe("missing code");
    expect(verifyOtp).not.toHaveBeenCalled();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  it("redirects legacy URLs that still carry ?code= on the reset page", async () => {
    const replace = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        href: "http://localhost/es/reset-password?code=abc",
        pathname: "/es/reset-password",
        replace,
        assign: vi.fn(),
      },
    });
    renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
      }),
    );
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        "/api/auth/recovery-callback?code=abc&next=%2Fes%2Freset-password",
      ),
    );
  });

  it("calls verifyOtp when token_hash and type=recovery are present", async () => {
    verifyOtp.mockResolvedValue({ data: {}, error: null });
    setWindowLocation(
      "http://localhost/es/reset-password?token_hash=th&type=recovery",
    );
    const { result } = renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
        skipRecoveryCodeRedirect: true,
      }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "th",
      type: "recovery",
    });
  });

  it("marks ready when getSession returns a session", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "x", refresh_token: "y", user: {} } },
      error: null,
    });
    setWindowLocation("http://localhost/es/reset-password");
    const { result } = renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
        skipRecoveryCodeRedirect: true,
      }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
  });

  it("falls back to invalid when exchange path fails verification", async () => {
    verifyOtp.mockResolvedValue({
      data: null,
      error: { message: "bad" },
    });
    setWindowLocation(
      "http://localhost/es/reset-password?token_hash=th&type=recovery",
    );
    const { result } = renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
        skipRecoveryCodeRedirect: true,
      }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("invalid"));
    expect(result.current.error).toBe("expired link");
  });

  it("rejects submit when password is empty", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "x", refresh_token: "y", user: {} } },
      error: null,
    });
    setWindowLocation("http://localhost/es/reset-password");
    const { result } = renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
        skipRecoveryCodeRedirect: true,
      }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("password required");
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("emits analytics on successful password update", async () => {
    getSession.mockResolvedValue({
      data: { session: { access_token: "x", refresh_token: "y", user: {} } },
      error: null,
    });
    updateUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    setWindowLocation("http://localhost/es/reset-password");
    const { result } = renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
        skipRecoveryCodeRedirect: true,
      }),
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

  it("flags mustChangeBanner=true when a session has app_metadata.must_change_password", async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "x",
          refresh_token: "y",
          user: { app_metadata: { must_change_password: true } },
        },
      },
      error: null,
    });
    setWindowLocation("http://localhost/es/reset-password");
    const { result } = renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
        skipRecoveryCodeRedirect: true,
      }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    expect(result.current.mustChangeBanner).toBe(true);
  });

  it("flags mustChangeBanner=false when the session has no must_change flag", async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "x",
          refresh_token: "y",
          user: { app_metadata: { provider: "email" } },
        },
      },
      error: null,
    });
    setWindowLocation("http://localhost/es/reset-password");
    const { result } = renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
        skipRecoveryCodeRedirect: true,
      }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    expect(result.current.mustChangeBanner).toBe(false);
  });

  it("clears the must_change_password flag after a successful password update", async () => {
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "x",
          refresh_token: "y",
          user: { app_metadata: { must_change_password: true } },
        },
      },
      error: null,
    });
    updateUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    setWindowLocation("http://localhost/es/reset-password");
    const { result } = renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
        skipRecoveryCodeRedirect: true,
      }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    act(() => {
      result.current.setPassword("longenough1");
      result.current.setConfirm("longenough1");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(clearMustChangeFlag).toHaveBeenCalledTimes(1);
    expect(result.current.success).toBe(true);
  });

  it("succeeds even if clearing the flag fails (best-effort)", async () => {
    clearMustChangeFlag.mockRejectedValue(new Error("network down"));
    getSession.mockResolvedValue({
      data: {
        session: {
          access_token: "x",
          refresh_token: "y",
          user: { app_metadata: { must_change_password: true } },
        },
      },
      error: null,
    });
    updateUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    setWindowLocation("http://localhost/es/reset-password");
    const { result } = renderHook(() =>
      useResetPassword({
        locale: "es",
        errors,
        skipRedirect: true,
        skipRecoveryCodeRedirect: true,
      }),
    );
    await waitFor(() => expect(result.current.linkStatus).toBe("ready"));
    act(() => {
      result.current.setPassword("longenough1");
      result.current.setConfirm("longenough1");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.success).toBe(true);
  });
});

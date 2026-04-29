// REGRESSION CHECK: Critical invariants for the login hook:
//  - Email-shaped identifier goes straight to signInWithPassword (no
//    network call to the resolver), so no extra latency for the common path.
//  - DNI-shaped identifier resolves via the opaque server endpoint and uses
//    the returned email; failed resolution surfaces as the same generic
//    "invalid credentials" message (opacity).
//  - Analytics events fire with `method: 'email' | 'dni'` and `success`,
//    so we can monitor adoption and brute-force patterns (regla 08).
//  - Empty identifier shows `identifierRequired` (renamed from
//    emailRequired); empty password shows passwordRequired.
//  - Open-redirect protection on `nextPath` is preserved unchanged.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogin } from "@/hooks/useLogin";

const mockSignInWithPassword = vi.fn();

const { mockSetRememberMePreference, mockTrackEvent } = vi.hoisted(() => ({
  mockSetRememberMePreference: vi.fn(),
  mockTrackEvent: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  }),
  getRememberMePreference: vi.fn(() => true),
  setRememberMePreference: mockSetRememberMePreference,
}));

vi.mock("@/lib/analytics/trackClient", () => ({
  trackEvent: mockTrackEvent,
}));

const assignSpy = vi.fn();

const loginOpts = { locale: "en" as const };

const errorMessages = {
  invalidCredentials: "Invalid email or password",
  identifierRequired: "Email or document is required",
  passwordRequired: "Password is required",
  generic: "An error occurred. Please try again.",
};

const fetchSpy = vi.fn();

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assignSpy.mockClear();
    fetchSpy.mockReset();
    vi.stubGlobal("location", {
      ...window.location,
      assign: assignSpy,
    });
    vi.stubGlobal("fetch", fetchSpy);
  });

  it("initializes with empty fields and no errors", () => {
    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    expect(result.current.identifier).toBe("");
    expect(result.current.password).toBe("");
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("updates identifier value", () => {
    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => result.current.setIdentifier("test@example.com"));
    expect(result.current.identifier).toBe("test@example.com");
  });

  it("updates password value", () => {
    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => result.current.setPassword("secret123"));
    expect(result.current.password).toBe("secret123");
  });

  it("shows identifierRequired error when identifier is empty on submit", async () => {
    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => result.current.setPassword("secret123"));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("Email or document is required");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows passwordRequired error when password is empty on submit", async () => {
    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => result.current.setIdentifier("test@example.com"));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("Password is required");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("does NOT call resolver when identifier is email-shaped", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("correct123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "correct123",
    });
  });

  it("calls /api/auth/resolve-login-id and uses returned email when identifier is DNI", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ email: "12345678@students.goldenenglish.local" }),
    });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier(" 12.345.678 ");
      result.current.setPassword("correct123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("/api/auth/resolve-login-id");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      identifier: "12345678",
    });
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "12345678@students.goldenenglish.local",
      password: "correct123",
    });
  });

  it("falls back to invalidCredentials when the resolver fetch returns non-ok", async () => {
    fetchSpy.mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("12345678");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("Invalid email or password");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("falls back to invalidCredentials when the resolver fetch throws", async () => {
    fetchSpy.mockRejectedValue(new Error("network down"));

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("12345678");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("Invalid email or password");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("shows error with invalid credentials from Supabase", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("wrong@example.com");
      result.current.setPassword("wrongpass");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("Invalid login credentials");
    expect(result.current.isLoading).toBe(false);
  });

  it("shows Supabase error message with code when present", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: {
        message: "Email not confirmed",
        code: "email_not_confirmed",
        status: 400,
      },
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("a@b.com");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe(
      "Email not confirmed (email_not_confirmed)",
    );
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("redirects on successful login", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("correct123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockSetRememberMePreference).toHaveBeenCalledWith(true);
    expect(assignSpy).toHaveBeenCalledWith("/en");
    expect(result.current.error).toBeNull();
  });

  it("emits trackEvent with method='email' on email login success", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "action",
      "auth:login",
      expect.objectContaining({ method: "email", success: true }),
    );
  });

  it("emits trackEvent with method='dni' on DNI login success", async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ email: "12345678@students.goldenenglish.local" }),
    });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("12345678");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "action",
      "auth:login",
      expect.objectContaining({ method: "dni", success: true }),
    );
  });

  it("emits trackEvent with success=false on auth failure", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("wrong@example.com");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      "action",
      "auth:login",
      expect.objectContaining({ method: "email", success: false }),
    );
  });

  it("passes remember-me false before sign-in when unchecked", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setRememberMe(false);
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("correct123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockSetRememberMePreference).toHaveBeenCalledWith(false);
  });

  it("uses next query path when safe", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() =>
      useLogin(errorMessages, {
        locale: "en",
        nextPath: "/en/dashboard/admin/users/import",
      }),
    );

    act(() => {
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("correct123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(assignSpy).toHaveBeenCalledWith("/en/dashboard/admin/users/import");
  });

  it("ignores unsafe next path", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() =>
      useLogin(errorMessages, {
        locale: "es",
        nextPath: "//evil.com/phish",
      }),
    );

    act(() => {
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("correct123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(assignSpy).toHaveBeenCalledWith("/es");
  });

  it("sets isLoading during submission", async () => {
    let resolveSignIn: (value: unknown) => void;
    mockSignInWithPassword.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("pass");
    });

    let submitPromise: Promise<void>;
    act(() => {
      submitPromise = result.current.handleSubmit();
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolveSignIn!({
        data: { user: { id: "1" }, session: {} },
        error: null,
      });
      await submitPromise!;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it("handles unexpected errors gracefully", async () => {
    mockSignInWithPassword.mockRejectedValue(new Error("Network failure"));

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("pass");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe(
      "An error occurred. Please try again.",
    );
    expect(result.current.isLoading).toBe(false);
  });

  it("uses invalidCredentials when auth error has no message", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "   " },
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("a@b.com");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("Invalid email or password");
  });

  it("uses trimmed message when auth error has message but no code", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "  Too many attempts  " },
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("a@b.com");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("Too many attempts");
  });

  it("shows generic error when session is missing after success response", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: null },
      error: null,
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("pass");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("An error occurred. Please try again.");
    expect(assignSpy).not.toHaveBeenCalled();
  });

  it("sets redirecting true after successful login", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() => useLogin(errorMessages, loginOpts));

    act(() => {
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("correct123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.redirecting).toBe(true);
  });

  it("falls back to locale path when next contains protocol-like segment", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() =>
      useLogin(errorMessages, {
        locale: "es",
        nextPath: "/es/page/http://trap",
      }),
    );

    act(() => {
      result.current.setIdentifier("user@example.com");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(assignSpy).toHaveBeenCalledWith("/es");
  });

  it("falls back when next contains backslash", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() =>
      useLogin(errorMessages, {
        locale: "en",
        nextPath: "/en\\windows",
      }),
    );

    act(() => {
      result.current.setIdentifier("u@e.com");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(assignSpy).toHaveBeenCalledWith("/en");
  });
});

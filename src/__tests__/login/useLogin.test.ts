// REGRESSION CHECK: This is the initial test suite for useLogin.
// No existing code to regress against — establishing baseline coverage.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogin } from "@/hooks/useLogin";

const mockSignInWithPassword = vi.fn();

const { mockSetRememberMePreference } = vi.hoisted(() => ({
  mockSetRememberMePreference: vi.fn(),
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

const assignSpy = vi.fn();

const loginOpts = { locale: "en" as const };

const mockDictionary = {
  login: {
    errors: {
      invalidCredentials: "Invalid email or password",
      emailRequired: "Email is required",
      passwordRequired: "Password is required",
      generic: "An error occurred. Please try again.",
    },
  },
};

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assignSpy.mockClear();
    vi.stubGlobal("location", {
      ...window.location,
      assign: assignSpy,
    });
  });

  it("initializes with empty fields and no errors", () => {
    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    expect(result.current.email).toBe("");
    expect(result.current.password).toBe("");
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it("updates email value", () => {
    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => result.current.setEmail("test@example.com"));
    expect(result.current.email).toBe("test@example.com");
  });

  it("updates password value", () => {
    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => result.current.setPassword("secret123"));
    expect(result.current.password).toBe("secret123");
  });

  it("shows error when email is empty on submit", async () => {
    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => result.current.setPassword("secret123"));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("Email is required");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("shows error when password is empty on submit", async () => {
    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => result.current.setEmail("test@example.com"));

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.error).toBe("Password is required");
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it("shows error with invalid credentials from Supabase", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: "Invalid login credentials" },
    });

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => {
      result.current.setEmail("wrong@example.com");
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

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => {
      result.current.setEmail("a@b.com");
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

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => {
      result.current.setEmail("user@example.com");
      result.current.setPassword("correct123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(mockSetRememberMePreference).toHaveBeenCalledWith(true);
    expect(assignSpy).toHaveBeenCalledWith("/en");
    expect(result.current.error).toBeNull();
  });

  it("passes remember-me false before sign-in when unchecked", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      result.current.setRememberMe(false);
      result.current.setEmail("user@example.com");
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
      useLogin(mockDictionary.login.errors, {
        locale: "en",
        nextPath: "/en/dashboard/admin/import",
      }),
    );

    act(() => {
      result.current.setEmail("user@example.com");
      result.current.setPassword("correct123");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(assignSpy).toHaveBeenCalledWith("/en/dashboard/admin/import");
  });

  it("ignores unsafe next path", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: "1" }, session: {} },
      error: null,
    });

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, {
        locale: "es",
        nextPath: "//evil.com/phish",
      }),
    );

    act(() => {
      result.current.setEmail("user@example.com");
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

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => {
      result.current.setEmail("user@example.com");
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

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => {
      result.current.setEmail("user@example.com");
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

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => {
      result.current.setEmail("a@b.com");
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

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => {
      result.current.setEmail("a@b.com");
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

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => {
      result.current.setEmail("user@example.com");
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

    const { result } = renderHook(() =>
      useLogin(mockDictionary.login.errors, loginOpts),
    );

    act(() => {
      result.current.setEmail("user@example.com");
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
      useLogin(mockDictionary.login.errors, {
        locale: "es",
        nextPath: "/es/page/http://trap",
      }),
    );

    act(() => {
      result.current.setEmail("user@example.com");
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
      useLogin(mockDictionary.login.errors, {
        locale: "en",
        nextPath: "/en\\windows",
      }),
    );

    act(() => {
      result.current.setEmail("u@e.com");
      result.current.setPassword("x");
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(assignSpy).toHaveBeenCalledWith("/en");
  });
});

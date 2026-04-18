// REGRESSION CHECK: Initial coverage for useRequestPasswordReset.
// Asserts client-side validation, success state and error surfacing.

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRequestPasswordReset } from "@/hooks/useRequestPasswordReset";

const errors = {
  emailRequired: "email required",
  emailInvalid: "email invalid",
  rateLimited: "rate limited",
  generic: "something failed",
};

describe("useRequestPasswordReset", () => {
  it("blocks submit when the email is empty", async () => {
    const submit = vi.fn();
    const { result } = renderHook(() =>
      useRequestPasswordReset({ locale: "en", errors, submit }),
    );
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("email required");
    expect(submit).not.toHaveBeenCalled();
  });

  it("blocks submit when the email is malformed", async () => {
    const submit = vi.fn();
    const { result } = renderHook(() =>
      useRequestPasswordReset({ locale: "en", errors, submit }),
    );
    act(() => {
      result.current.setEmail("not-an-email");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("email invalid");
    expect(submit).not.toHaveBeenCalled();
  });

  it("calls the submitter and stores the submitted email on success", async () => {
    const submit = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useRequestPasswordReset({ locale: "es", errors, submit }),
    );
    act(() => {
      result.current.setEmail("user@example.com");
    });
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(submit).toHaveBeenCalledWith("es", "user@example.com");
    expect(result.current.submittedEmail).toBe("user@example.com");
    expect(result.current.error).toBeNull();
  });

  it("surfaces the action's message when ok=false", async () => {
    const submit = vi.fn().mockResolvedValue({ ok: false, message: "rate limited" });
    const { result } = renderHook(() =>
      useRequestPasswordReset({ locale: "en", errors, submit }),
    );
    act(() => result.current.setEmail("user@example.com"));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("rate limited");
    expect(result.current.submittedEmail).toBeNull();
  });

  it("falls back to the generic error when submitter throws", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const submit = vi.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() =>
      useRequestPasswordReset({ locale: "en", errors, submit }),
    );
    act(() => result.current.setEmail("user@example.com"));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.error).toBe("something failed");
    consoleSpy.mockRestore();
  });

  it("reset() clears the submitted state and email", async () => {
    const submit = vi.fn().mockResolvedValue({ ok: true });
    const { result } = renderHook(() =>
      useRequestPasswordReset({ locale: "en", errors, submit }),
    );
    act(() => result.current.setEmail("user@example.com"));
    await act(async () => {
      await result.current.handleSubmit();
    });
    expect(result.current.submittedEmail).toBe("user@example.com");
    act(() => result.current.reset());
    expect(result.current.submittedEmail).toBeNull();
    expect(result.current.email).toBe("");
  });
});

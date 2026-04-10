// REGRESSION CHECK: Initial test for LoginForm organism.
// Depends on useLogin hook — mocked at boundary per TDD rules.

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/organisms/LoginForm";

const mockHandleSubmit = vi.fn();
const mockSetEmail = vi.fn();
const mockSetPassword = vi.fn();

const defaultHookReturn = {
  email: "",
  password: "",
  error: null as string | null,
  redirecting: false,
  isLoading: false,
  setEmail: mockSetEmail,
  setPassword: mockSetPassword,
  handleSubmit: mockHandleSubmit,
};

vi.mock("@/hooks/useLogin", () => ({
  useLogin: () => defaultHookReturn,
}));

const labels = {
  kicker: "Portal",
  title: "Sign In",
  subtitle: "Welcome back",
  emailLabel: "Email",
  emailPlaceholder: "you@example.com",
  passwordLabel: "Password",
  passwordPlaceholder: "Your password",
  submitButton: "Sign In",
  redirecting: "Signing you in…",
  forgotPassword: "Forgot your password?",
  noAccount: "Don't have an account?",
  signUp: "Sign up",
  showPassword: "Show password",
  hidePassword: "Hide password",
  errors: {
    invalidCredentials: "Invalid email or password",
    emailRequired: "Email is required",
    passwordRequired: "Password is required",
    generic: "An error occurred.",
  },
};

describe("LoginForm", () => {
  it("renders email and password fields", () => {
    render(<LoginForm labels={labels} locale="en" />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(labels.passwordPlaceholder),
    ).toBeInTheDocument();
  });

  it("renders show password toggle", () => {
    render(<LoginForm labels={labels} locale="en" />);

    expect(
      screen.getByRole("button", { name: /show password/i }),
    ).toBeInTheDocument();
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm labels={labels} locale="en" />);

    const pwd = screen.getByPlaceholderText(
      labels.passwordPlaceholder,
    ) as HTMLInputElement;
    expect(pwd.type).toBe("password");

    await user.click(screen.getByRole("button", { name: /show password/i }));
    expect(pwd.type).toBe("text");

    await user.click(screen.getByRole("button", { name: /hide password/i }));
    expect(pwd.type).toBe("password");
  });

  it("renders sign-in button", () => {
    render(<LoginForm labels={labels} locale="en" />);

    expect(
      screen.getByRole("button", { name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it("displays error message when present", () => {
    defaultHookReturn.error = "Invalid email or password";

    render(<LoginForm labels={labels} locale="en" />);

    expect(
      screen.getByText("Invalid email or password"),
    ).toBeInTheDocument();

    defaultHookReturn.error = null;
  });

  it("calls handleSubmit on form submission", async () => {
    const user = userEvent.setup();
    render(<LoginForm labels={labels} locale="en" />);

    const button = screen.getByRole("button", { name: /sign in/i });
    await user.click(button);

    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it("disables button when loading", () => {
    defaultHookReturn.isLoading = true;

    render(<LoginForm labels={labels} locale="en" />);

    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();

    defaultHookReturn.isLoading = false;
  });
});

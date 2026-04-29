// REGRESSION CHECK: Critical invariants for LoginForm:
//  - Renders a SINGLE identifier input (no separate email field) so the
//    same form accepts both real emails and DNI/passport numbers.
//  - autoComplete="username" so password managers keep working.
//  - Uses identifierLabel / identifierPlaceholder from the dictionary; no
//    hardcoded strings.
//  - Submission still wires to handleSubmit via both click and submit.

import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/organisms/LoginForm";

const mockHandleSubmit = vi.fn();
const mockSetIdentifier = vi.fn();
const mockSetPassword = vi.fn();
const mockSetRememberMe = vi.fn();

const defaultHookReturn = {
  identifier: "",
  password: "",
  rememberMe: true,
  error: null as string | null,
  redirecting: false,
  isLoading: false,
  setIdentifier: mockSetIdentifier,
  setPassword: mockSetPassword,
  setRememberMe: mockSetRememberMe,
  handleSubmit: mockHandleSubmit,
};

function resetLoginFormHookMock() {
  defaultHookReturn.identifier = "";
  defaultHookReturn.password = "";
  defaultHookReturn.rememberMe = true;
  defaultHookReturn.error = null;
  defaultHookReturn.redirecting = false;
  defaultHookReturn.isLoading = false;
}

vi.mock("@/hooks/useLogin", () => ({
  useLogin: () => defaultHookReturn,
}));

const labels = {
  kicker: "Portal",
  title: "Sign In",
  subtitle: "Welcome back",
  identifierLabel: "Email or document",
  identifierPlaceholder: "you@example.com or 12345678",
  identifierHint: "Use your email, or your DNI/passport.",
  passwordLabel: "Password",
  passwordPlaceholder: "Your password",
  passwordHintStudent: "Use DNI as password.",
  submitButton: "Sign In",
  rememberMe: "Remember me",
  redirecting: "Signing you in…",
  forgotPassword: "Forgot your password?",
  noAccount: "Don't have an account?",
  signUp: "Sign up",
  showPassword: "Show password",
  hidePassword: "Hide password",
  errors: {
    invalidCredentials: "Invalid email or password",
    identifierRequired: "Email or document is required",
    passwordRequired: "Password is required",
    generic: "An error occurred.",
  },
};

describe("LoginForm", () => {
  beforeEach(() => {
    resetLoginFormHookMock();
    vi.clearAllMocks();
  });

  it("renders a single identifier input and the password field", () => {
    render(<LoginForm labels={labels} locale="en" />);

    const identifier = screen.getByLabelText(
      /email or document/i,
    ) as HTMLInputElement;
    expect(identifier).toBeInTheDocument();
    expect(identifier.type).toBe("text");
    expect(identifier.autocomplete).toBe("username");
    // No legacy `email`-typed field.
    expect(
      screen.queryAllByDisplayValue("").filter((el) =>
        el instanceof HTMLInputElement && el.type === "email",
      ),
    ).toHaveLength(0);
    expect(
      screen.getByPlaceholderText(labels.passwordPlaceholder),
    ).toBeInTheDocument();
  });

  it("shows the identifier hint copy from the dictionary", () => {
    render(<LoginForm labels={labels} locale="en" />);
    expect(screen.getByText(labels.identifierHint)).toBeInTheDocument();
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
  });

  it("shows redirecting status when enabled by hook", () => {
    defaultHookReturn.redirecting = true;
    render(<LoginForm labels={labels} locale="en" />);
    expect(screen.getByRole("status")).toHaveTextContent(labels.redirecting);
  });

  it("calls handleSubmit on form submission", async () => {
    const user = userEvent.setup();
    const { container } = render(<LoginForm labels={labels} locale="en" />);

    const button = screen.getByRole("button", { name: /sign in/i });
    await user.click(button);

    expect(mockHandleSubmit).toHaveBeenCalled();

    mockHandleSubmit.mockClear();
    const formEl = container.querySelector("form");
    expect(formEl).toBeTruthy();
    fireEvent.submit(formEl!);
    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it("disables button when loading", () => {
    defaultHookReturn.isLoading = true;

    render(<LoginForm labels={labels} locale="en" />);

    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
  });
});

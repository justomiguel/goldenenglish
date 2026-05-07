import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminUserDetailDniResetSection } from "@/components/molecules/AdminUserDetailDniResetSection";
import { dictEn } from "@/test/dictEn";

const resetActionMock = vi.fn();
const onFeedbackMock = vi.fn();
const writeTextMock = vi.fn().mockResolvedValue(undefined);
const refreshMock = vi.fn();

vi.mock(
  "@/app/[locale]/dashboard/admin/users/adminUserDetailCredentialActions",
  () => ({
    resetUserPasswordByDniAction: (...a: unknown[]) => resetActionMock(...a),
  }),
);

vi.mock("next/navigation", () => ({
  usePathname: () => "/es",
  useRouter: () => ({ refresh: refreshMock }),
}));

beforeEach(() => {
  resetActionMock.mockReset();
  onFeedbackMock.mockReset();
  writeTextMock.mockClear();
  refreshMock.mockReset();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: writeTextMock },
  });
});

function renderSection(overrides: Partial<React.ComponentProps<typeof AdminUserDetailDniResetSection>> = {}) {
  return render(
    <AdminUserDetailDniResetSection
      locale="en"
      userId="00000000-0000-4000-8000-000000000001"
      labels={dictEn.admin.users}
      enabled
      onFeedback={onFeedbackMock}
      {...overrides}
    />,
  );
}

describe("AdminUserDetailDniResetSection", () => {
  it("does not render when enabled is false", () => {
    const { container } = renderSection({ enabled: false });
    expect(container.firstChild).toBeNull();
  });

  it("renders the title and trigger button when enabled", () => {
    renderSection();
    expect(
      screen.getByText(dictEn.admin.users.detailDniResetTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: dictEn.admin.users.detailDniResetButton,
      }),
    ).toBeInTheDocument();
  });

  it("opens the confirmation modal asking for the admin password", () => {
    renderSection();
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.detailDniResetButton,
      }),
    );
    expect(
      screen.getByText(dictEn.admin.users.detailDniResetConfirmTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(dictEn.admin.users.detailDniResetAdminPasswordLabel),
    ).toBeInTheDocument();
  });

  it("calls the action and reveals the new password on success (real email)", async () => {
    resetActionMock.mockResolvedValue({
      ok: true,
      password: "12345678",
      hasRealEmail: true,
      message: dictEn.admin.users.detailDniResetToastOk,
    });
    renderSection();
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.detailDniResetButton,
      }),
    );
    fireEvent.change(
      screen.getByLabelText(dictEn.admin.users.detailDniResetAdminPasswordLabel),
      { target: { value: "admin-password" } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.detailDniResetConfirmAction,
      }),
    );
    await waitFor(() => expect(resetActionMock).toHaveBeenCalledTimes(1));
    expect(resetActionMock.mock.calls[0][0]).toEqual({
      locale: "en",
      targetUserId: "00000000-0000-4000-8000-000000000001",
      adminPassword: "admin-password",
      confirmed: true,
    });
    await waitFor(() =>
      expect(
        screen.getByText(dictEn.admin.users.detailDniResetRevealTitle),
      ).toBeInTheDocument(),
    );
    expect(screen.getByDisplayValue("12345678")).toBeInTheDocument();
    expect(
      screen.getByText(dictEn.admin.users.detailDniResetRevealNoticeReal),
    ).toBeInTheDocument();
  });

  it("shows the synthetic-email notice when no real email exists", async () => {
    resetActionMock.mockResolvedValue({
      ok: true,
      password: "12345678",
      hasRealEmail: false,
    });
    renderSection();
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.detailDniResetButton,
      }),
    );
    fireEvent.change(
      screen.getByLabelText(dictEn.admin.users.detailDniResetAdminPasswordLabel),
      { target: { value: "admin-password" } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.detailDniResetConfirmAction,
      }),
    );
    await waitFor(() =>
      expect(
        screen.getByText(
          dictEn.admin.users.detailDniResetRevealNoticeSynthetic,
        ),
      ).toBeInTheDocument(),
    );
  });

  it("calls onFeedback with an error message when the action fails", async () => {
    resetActionMock.mockResolvedValue({
      ok: false,
      message: dictEn.admin.users.detailDniResetErrAdminPassword,
    });
    renderSection();
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.detailDniResetButton,
      }),
    );
    fireEvent.change(
      screen.getByLabelText(dictEn.admin.users.detailDniResetAdminPasswordLabel),
      { target: { value: "wrong" } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: dictEn.admin.users.detailDniResetConfirmAction,
      }),
    );
    await waitFor(() => expect(onFeedbackMock).toHaveBeenCalled());
    expect(onFeedbackMock).toHaveBeenCalledWith(
      dictEn.admin.users.detailDniResetErrAdminPassword,
      false,
    );
  });
});

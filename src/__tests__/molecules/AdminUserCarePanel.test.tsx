import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import es from "@/dictionaries/es.json";
import { AdminUserCarePanel } from "@/components/molecules/AdminUserCarePanel";
import type { StudentCareNotes } from "@/lib/students/care/loadStudentCareNotes";

const U = es.admin.users;
const USER_ID = "11111111-1111-4111-8111-111111111111";

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}));

const mockSave = vi.fn();
vi.mock("@/app/[locale]/dashboard/admin/users/adminUserDetailActions", () => ({
  saveStudentCareNotesAction: (...args: unknown[]) => mockSave(...args),
}));

const EMPTY_CARE: StudentCareNotes = {
  healthNote: null,
  dietNote: null,
  supportNote: null,
  updatedAt: null,
  updatedByName: null,
};

const FILLED_CARE: StudentCareNotes = {
  healthNote: "Asma leve",
  dietNote: "Sin gluten",
  supportNote: null,
  updatedAt: "2026-08-01T12:00:00.000Z",
  updatedByName: "Ruiz Ana",
};

function renderPanel(
  overrides: Partial<React.ComponentProps<typeof AdminUserCarePanel>> = {},
) {
  return render(
    <AdminUserCarePanel
      locale="es"
      userId={USER_ID}
      labels={U}
      editable
      care={EMPTY_CARE}
      onFeedback={vi.fn()}
      {...overrides}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSave.mockResolvedValue({ ok: true, message: U.detailCareSaved });
});

describe("AdminUserCarePanel", () => {
  it("shows the three fields with their hints", () => {
    renderPanel();

    expect(screen.getByLabelText(U.detailFieldCareHealth)).toBeInTheDocument();
    expect(screen.getByLabelText(U.detailFieldCareDiet)).toBeInTheDocument();
    expect(screen.getByLabelText(U.detailFieldCareSupport)).toBeInTheDocument();
    expect(screen.getByText(U.detailCareHealthHint)).toBeInTheDocument();
  });

  it("says who may read this, because the admin is typing about a child's health", () => {
    renderPanel();
    expect(screen.getByText(U.detailCareLead)).toBeInTheDocument();
  });

  it("hides the detail entirely from a viewer who is not entitled to it", () => {
    renderPanel({ care: null });

    expect(screen.getByText(U.detailCareForbidden)).toBeInTheDocument();
    expect(screen.queryByLabelText(U.detailFieldCareHealth)).not.toBeInTheDocument();
  });

  it("shows the stored notes when there are some", () => {
    renderPanel({ care: FILLED_CARE });

    expect(screen.getByLabelText(U.detailFieldCareHealth)).toHaveValue("Asma leve");
    expect(screen.getByLabelText(U.detailFieldCareDiet)).toHaveValue("Sin gluten");
  });

  it("names who last touched it, and only once there is a stamp", () => {
    const { unmount } = renderPanel({ care: FILLED_CARE });
    expect(screen.getByText(/Ruiz Ana/)).toBeInTheDocument();
    unmount();

    renderPanel({ care: EMPTY_CARE });
    expect(screen.queryByText(/Ruiz Ana/)).not.toBeInTheDocument();
  });

  it("tells a read-only viewer there is nothing recorded instead of showing empty boxes", () => {
    renderPanel({ editable: false, care: EMPTY_CARE });

    expect(screen.getByText(U.detailCareEmpty)).toBeInTheDocument();
    expect(screen.queryByLabelText(U.detailFieldCareHealth)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: U.detailConfirmSave })).not.toBeInTheDocument();
  });

  it("saves the trimmed drafts and refreshes", async () => {
    const onFeedback = vi.fn();
    const user = userEvent.setup();
    renderPanel({ onFeedback });

    await user.type(screen.getByLabelText(U.detailFieldCareHealth), "  Asma leve  ");
    await user.click(screen.getByRole("button", { name: U.detailConfirmSave }));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
    expect(mockSave).toHaveBeenCalledWith({
      locale: "es",
      targetUserId: USER_ID,
      healthNote: "Asma leve",
      dietNote: "",
      supportNote: "",
    });
    expect(onFeedback).toHaveBeenCalledWith(U.detailCareSaved, true);
    expect(mockRefresh).toHaveBeenCalled();
  });

  it("reports the server's error message and does not refresh", async () => {
    mockSave.mockResolvedValue({ ok: false, message: U.detailErrCareSave });
    const onFeedback = vi.fn();
    const user = userEvent.setup();
    renderPanel({ onFeedback });

    await user.click(screen.getByRole("button", { name: U.detailConfirmSave }));

    await waitFor(() => expect(onFeedback).toHaveBeenCalledWith(U.detailErrCareSave, false));
    expect(mockRefresh).not.toHaveBeenCalled();
  });
});

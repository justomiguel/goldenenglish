import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { dictEn } from "@/test/dictEn";
import { TutorFinancialAccessSection } from "@/components/molecules/TutorFinancialAccessSection";

const setTutorFinancialAccess = vi.fn();
vi.mock(
  "@/app/[locale]/dashboard/profile/tutorFinancialAccessActions",
  () => ({
    setTutorFinancialAccess: (...args: unknown[]) =>
      setTutorFinancialAccess(...args),
  }),
);

const routerRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh }),
}));

const labels = dictEn.dashboard.myProfile;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TutorFinancialAccessSection", () => {
  it("renders the empty state when no tutors are linked", () => {
    render(
      <TutorFinancialAccessSection locale="en" tutors={[]} labels={labels} />,
    );
    expect(screen.getByText(labels.tutorAccessNoTutors)).toBeInTheDocument();
  });

  it("renders one row per tutor with active status and a revoke action", () => {
    render(
      <TutorFinancialAccessSection
        locale="en"
        labels={labels}
        tutors={[
          {
            tutorId: "tutor-1",
            displayName: "Maria Tutor",
            financialAccessActive: true,
          },
          {
            tutorId: "tutor-2",
            displayName: "Pedro Tutor",
            financialAccessActive: false,
          },
        ]}
      />,
    );
    expect(screen.getByText("Maria Tutor")).toBeInTheDocument();
    expect(screen.getByText("Pedro Tutor")).toBeInTheDocument();
    expect(screen.getByText(labels.tutorAccessActive)).toBeInTheDocument();
    expect(screen.getByText(labels.tutorAccessRevoked)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: labels.tutorAccessRevoke }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: labels.tutorAccessRestore }),
    ).toBeInTheDocument();
  });

  it("calls setTutorFinancialAccess with intent=revoke when clicking revoke", async () => {
    setTutorFinancialAccess.mockResolvedValue({ ok: true });
    render(
      <TutorFinancialAccessSection
        locale="en"
        labels={labels}
        tutors={[
          {
            tutorId: "tutor-1",
            displayName: "Maria Tutor",
            financialAccessActive: true,
          },
        ]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: labels.tutorAccessRevoke }),
    );
    await waitFor(() => expect(setTutorFinancialAccess).toHaveBeenCalled());
    const formData = setTutorFinancialAccess.mock.calls[0][0] as FormData;
    expect(formData.get("intent")).toBe("revoke");
    expect(formData.get("tutorId")).toBe("tutor-1");
    expect(formData.get("locale")).toBe("en");
    await waitFor(() =>
      expect(screen.getByText(labels.tutorAccessUpdated)).toBeInTheDocument(),
    );
  });

  it("calls setTutorFinancialAccess with intent=restore when clicking restore", async () => {
    setTutorFinancialAccess.mockResolvedValue({ ok: true });
    render(
      <TutorFinancialAccessSection
        locale="en"
        labels={labels}
        tutors={[
          {
            tutorId: "tutor-1",
            displayName: "Maria Tutor",
            financialAccessActive: false,
          },
        ]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: labels.tutorAccessRestore }),
    );
    await waitFor(() => expect(setTutorFinancialAccess).toHaveBeenCalled());
    const formData = setTutorFinancialAccess.mock.calls[0][0] as FormData;
    expect(formData.get("intent")).toBe("restore");
  });

  it("surfaces a feedback message when the action fails", async () => {
    setTutorFinancialAccess.mockResolvedValue({ ok: false, message: "boom" });
    render(
      <TutorFinancialAccessSection
        locale="en"
        labels={labels}
        tutors={[
          {
            tutorId: "tutor-1",
            displayName: "Maria Tutor",
            financialAccessActive: true,
          },
        ]}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: labels.tutorAccessRevoke }),
    );
    await waitFor(() =>
      expect(screen.getByText(/boom/)).toBeInTheDocument(),
    );
  });
});

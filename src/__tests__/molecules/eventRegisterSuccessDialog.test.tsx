import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EventRegisterSuccessDialog } from "@/components/molecules/EventRegisterSuccessDialog";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/es/events/test/register",
}));

const labels = {
  title: "Thank you!",
  body: "Your registration was submitted successfully.",
  close: "Back to home",
};

describe("EventRegisterSuccessDialog", () => {
  beforeEach(() => {
    pushMock.mockClear();
  });

  it("navigates home when close button is clicked", () => {
    render(<EventRegisterSuccessDialog locale="es" open labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: labels.close }));
    expect(pushMock).toHaveBeenCalledWith("/es");
  });
});

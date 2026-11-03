/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DailyCallScreen } from "@/components/daily/DailyCallScreen";

const join = vi.fn().mockResolvedValue(undefined);
const leave = vi.fn().mockResolvedValue(undefined);
const destroy = vi.fn();
const createFrame = vi.fn(() => ({ join, leave, destroy }));

vi.mock("@daily-co/daily-js", () => ({
  default: {
    createFrame,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn(), replace: vi.fn() }),
}));

const leaveLabel = "Leave the class";

describe("DailyCallScreen", () => {
  beforeEach(() => {
    join.mockClear();
    leave.mockClear();
    destroy.mockClear();
    createFrame.mockClear();
  });

  it("names the leave control and joins with the room url and token", async () => {
    const { container } = render(
      <DailyCallScreen
        url="https://academia.daily.co/sroom"
        token="meet-token"
        leaveLabel={leaveLabel}
        backHref="/es/dashboard/student"
      />,
    );

    expect(screen.getByRole("button", { name: leaveLabel })).toBeInTheDocument();
    expect(container.textContent).not.toContain("apiKey");

    await waitFor(() => {
      expect(join).toHaveBeenCalledWith({
        url: "https://academia.daily.co/sroom",
        token: "meet-token",
      });
    });
  });
});

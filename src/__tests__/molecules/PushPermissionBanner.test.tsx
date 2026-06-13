import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PushPermissionBanner } from "@/components/molecules/PushPermissionBanner";

const subscribeToPush = vi.fn();

vi.mock("@/lib/push/subscribePushClient", () => ({
  subscribeToPush: (...args: unknown[]) => subscribeToPush(...args),
}));

const copy = {
  pushTitle: "Stay in the loop",
  pushLead: "Allow notifications",
  pushEnable: "Enable",
  pushLater: "Later",
};

describe("PushPermissionBanner", () => {
  beforeEach(() => {
    subscribeToPush.mockReset();
    window.localStorage.clear();
    Object.defineProperty(window, "Notification", {
      configurable: true,
      value: {
        permission: "default",
        requestPermission: vi.fn(),
      },
    });
  });

  it("renders when permission is default and calls subscribe on enable", async () => {
    subscribeToPush.mockResolvedValue({ ok: true });
    render(<PushPermissionBanner copy={copy} storageKey="ge_test_push" />);
    await waitFor(() => expect(screen.getByText(copy.pushTitle)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: copy.pushEnable }));
    await waitFor(() => expect(subscribeToPush).toHaveBeenCalled());
  });

  it("hides when dismissed", async () => {
    render(<PushPermissionBanner copy={copy} storageKey="ge_test_push" />);
    await waitFor(() => expect(screen.getByText(copy.pushTitle)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: copy.pushLater }));
    await waitFor(() => expect(screen.queryByText(copy.pushTitle)).not.toBeInTheDocument());
  });
});

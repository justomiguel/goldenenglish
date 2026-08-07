// REGRESSION CHECK: Global floating host must surface install CTA once and clear
// bottom chrome (tab bar) on narrow viewports without duplicating inline mounts.
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { PwaInstallPromptHost } from "@/components/molecules/PwaInstallPromptHost";
import { installMemoryLocalStorage } from "@/__tests__/helpers/installMemoryLocalStorage";

const copy = {
  title: "Install the app",
  lead: "Add to home screen",
  install: "Install",
  later: "Not now",
  iosLead: "Install on iPhone",
  iosSteps: "Share then Add to Home Screen",
};

describe("PwaInstallPromptHost", () => {
  beforeEach(() => {
    installMemoryLocalStorage().clear();
  });

  it("renders a floating region and shows install CTA after beforeinstallprompt", async () => {
    render(<PwaInstallPromptHost copy={copy} />);

    const region = screen.getByTestId("pwa-install-prompt-host");
    expect(region.className).toMatch(/fixed/);
    expect(region.className).toMatch(/z-\[200\]/);

    const event = new Event("beforeinstallprompt") as Event & {
      preventDefault: () => void;
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "dismissed" }>;
    };
    event.preventDefault = () => {};
    event.prompt = async () => {};
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);

    await waitFor(() =>
      expect(screen.getByText(copy.title)).toBeInTheDocument(),
    );
    expect(screen.getByRole("button", { name: copy.install })).toBeInTheDocument();
  });

  it("reserves bottom clearance for mobile chrome", () => {
    render(<PwaInstallPromptHost copy={copy} />);
    const region = screen.getByTestId("pwa-install-prompt-host");
    expect(region.className).toMatch(/4\.5rem/);
  });
});

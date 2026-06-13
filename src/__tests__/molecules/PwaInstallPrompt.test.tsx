import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PwaInstallPrompt } from "@/components/molecules/PwaInstallPrompt";

const copy = {
  title: "Install the app",
  lead: "Add to home screen",
  install: "Install",
  later: "Not now",
  iosLead: "Install on iPhone",
  iosSteps: "Share then Add to Home Screen",
};

describe("PwaInstallPrompt", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("shows install CTA after beforeinstallprompt", async () => {
    render(<PwaInstallPrompt copy={copy} />);
    const event = new Event("beforeinstallprompt") as Event & {
      preventDefault: () => void;
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "dismissed" }>;
    };
    event.preventDefault = () => {};
    event.prompt = async () => {};
    event.userChoice = Promise.resolve({ outcome: "dismissed" });
    window.dispatchEvent(event);
    await waitFor(() => expect(screen.getByText(copy.title)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: copy.install })).toBeInTheDocument();
  });

  it("dismisses on later", async () => {
    render(<PwaInstallPrompt copy={copy} />);
    const event = new Event("beforeinstallprompt") as Event & {
      preventDefault: () => void;
    };
    event.preventDefault = () => {};
    window.dispatchEvent(event);
    await waitFor(() => expect(screen.getByText(copy.title)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("button", { name: copy.later }));
    await waitFor(() => expect(screen.queryByText(copy.title)).not.toBeInTheDocument());
  });
});

// REGRESSION CHECK: Parent Help FAB leads with Explain CTA then task list;
// explain uses startExplainParentScreenTour; Play uses startParentTutorial.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ParentHelpLauncher } from "@/components/dashboard/ParentHelpLauncher";

const push = vi.fn();
const startTutorial = vi.fn().mockResolvedValue(undefined);
const startExplain = vi.fn().mockResolvedValue(undefined);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => "/es/dashboard/parent",
}));

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => "web-desktop",
}));

vi.mock("@/lib/parent-tutorials/client/startParentTutorial", () => ({
  startParentTutorial: (...args: unknown[]) => startTutorial(...args),
}));

vi.mock("@/lib/parent-tutorials/client/startExplainParentScreenTour", () => ({
  startExplainParentScreenTour: (...args: unknown[]) => startExplain(...args),
}));

const launcherDict = {
  fabAria: "Open family help",
  fabTitle: "Help",
  helpTitle: "Family help",
  panelDesc: "Panel desc",
  closePanel: "Close help panel",
};

const explainScreenDict = {
  sectionHeading: "This screen",
  sectionAria: "Explain this screen",
  startCta: "Explain this screen",
  startCtaAria: "Explain this screen: {{title}}",
  starting: "Starting…",
  unavailable: "Coming soon.",
  unavailableCtaAria: "Explain this screen (not available yet)",
};

const screenToursDict = {
  parentHome: {
    meta: { title: "Family home", description: "Hub overview" },
    doneBtn: "Done",
    nextBtn: "Next",
    prevBtn: "Back",
    closeBtn: "Close",
    progressText: "{{current}} of {{total}}",
    steps: {
      intro: { title: "i", description: "d" },
      sidebar: { title: "s", description: "d" },
      tabBar: { title: "t", description: "d" },
      chromeHeader: { title: "h", description: "d" },
      chromeProfile: { title: "p", description: "d" },
      chromeSignOut: { title: "o", description: "d" },
      titleBlock: { title: "tb", description: "d" },
      childSwitcher: { title: "c", description: "d" },
      statusPillars: { title: "sp", description: "d" },
      inbox: { title: "in", description: "d" },
      closing: { title: "cl", description: "d" },
    },
  },
} as unknown as import("@/types/i18n").Dictionary["dashboard"]["parentHelpScreenTours"];

const catalogDict = {
  startCta: "Start tutorial",
  startCtaAria: "Start tutorial: {{title}}",
  listAria: "Available tutorials",
  empty: "No tutorials",
  sectionHeading: "How-to",
  "parent-pay-or-upload-receipt": {
    title: "Pay",
    description: "Pay desc",
  },
  "parent-view-child-progress": { title: "Progress", description: "d" },
  "parent-read-reply-messages": { title: "Messages", description: "d" },
  "parent-manage-child-or-tutor-profile": { title: "Profile", description: "d" },
  "parent-calendar-attendance": { title: "Calendar", description: "d" },
  "parent-badges-overview": { title: "Badges", description: "d" },
  "parent-settings-notifications": { title: "Settings", description: "d" },
} as unknown as import("@/types/i18n").Dictionary["dashboard"]["parentHelpCatalog"];

const toursDict = {} as import("@/types/i18n").Dictionary["dashboard"]["parentHelpTours"];

function renderLauncher() {
  return render(
    <ParentHelpLauncher
      locale="es"
      launcherDict={launcherDict}
      catalogDict={catalogDict}
      toursDict={toursDict}
      explainScreenDict={explainScreenDict}
      screenToursDict={screenToursDict}
    />,
  );
}

describe("ParentHelpLauncher", () => {
  beforeEach(() => {
    push.mockClear();
    startTutorial.mockClear();
    startExplain.mockClear();
  });

  it("opens panel and starts explain for parent home", async () => {
    const user = userEvent.setup();
    renderLauncher();
    await user.click(screen.getByRole("button", { name: launcherDict.fabAria }));
    expect(screen.getByText("Family home")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Explain this screen: Family home" }),
    );
    expect(startExplain).toHaveBeenCalled();
  });

  it("lists task tutorials", async () => {
    const user = userEvent.setup();
    renderLauncher();
    await user.click(screen.getByRole("button", { name: launcherDict.fabAria }));
    expect(screen.getByText("Pay")).toBeInTheDocument();
    expect(screen.getByLabelText("Available tutorials")).toBeInTheDocument();
  });
});

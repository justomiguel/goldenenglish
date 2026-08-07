// REGRESSION CHECK: Tutorials FAB shows contextual explain CTA first, then task
// tutorials; Play still goes through startAdminTutorial; explain uses startExplainScreenTour.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminHelpLauncher } from "@/components/dashboard/AdminHelpLauncher";

const push = vi.fn();
const startTutorial = vi.fn().mockResolvedValue(undefined);
const startExplain = vi.fn().mockResolvedValue(undefined);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
  usePathname: () => "/es/dashboard/admin",
}));

const useAppSurface = vi.fn(() => "web-desktop");

vi.mock("@/hooks/useAppSurface", () => ({
  useAppSurface: () => useAppSurface(),
}));

vi.mock("@/lib/admin-tutorials/client/startAdminTutorial", () => ({
  startAdminTutorial: (...args: unknown[]) => startTutorial(...args),
}));

vi.mock("@/lib/admin-tutorials/client/startExplainScreenTour", () => ({
  startExplainScreenTour: (...args: unknown[]) => startExplain(...args),
}));

const launcherDict = {
  fabAria: "Open tutorials",
  fabTitle: "Tutorials",
  helpTitle: "Tutorials",
  panelDesc: "Panel desc",
  closePanel: "Close tutorials panel",
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
  adminHome: {
    meta: {
      title: "Admin home",
      description: "Hub overview",
    },
    doneBtn: "Done",
    nextBtn: "Next",
    prevBtn: "Back",
    closeBtn: "Close",
    progressText: "{{current}} of {{total}}",
    steps: {
      intro: { title: "i", description: "d" },
      sidebar: { title: "s", description: "d" },
      chromeHeader: { title: "h", description: "d" },
      chromeBackToSite: { title: "site", description: "d" },
      chromeTeacherPortal: { title: "teach", description: "d" },
      chromeSignOut: { title: "out", description: "d" },
      chromeLocale: { title: "lang", description: "d" },
      titleBlock: { title: "t", description: "d" },
      studentsWithoutSection: { title: "b", description: "d" },
      birthdays: { title: "bd", description: "d" },
      traffic: { title: "tr", description: "d" },
      users: { title: "u", description: "d" },
      payments: { title: "p", description: "d" },
      registrations: { title: "r", description: "d" },
      messages: { title: "m", description: "d" },
      closing: { title: "c", description: "d" },
    },
  },
};

const catalogDict = {
  startCta: "Start tutorial",
  startCtaAria: "Start tutorial: {{title}}",
  listAria: "Available tutorials",
  empty: "No tutorials",
  "create-cohort": {
    title: "How do I create a cohort?",
    description: "Walkthrough",
  },
  "create-section": {
    title: "How do I create a section?",
    description: "Section walkthrough",
  },
  "create-student": {
    title: "How do I create a student?",
    description: "Student walkthrough",
  },
  "create-teacher": {
    title: "How do I create a teacher?",
    description: "Teacher walkthrough",
  },
  "create-admin": {
    title: "How do I create an admin?",
    description: "Admin walkthrough",
  },
  "create-event": {
    title: "How do I create an event?",
    description: "Event walkthrough",
  },
  "approve-payment": {
    title: "How do I approve a payment?",
    description: "Approve walkthrough",
  },
  "reject-payment": {
    title: "How do I reject a payment?",
    description: "Reject walkthrough",
  },
  "take-attendance": {
    title: "How do I take attendance?",
    description: "Attendance walkthrough",
  },
  "assign-scholarship-percent": {
    title: "How do I assign a partial scholarship?",
    description: "Partial scholarship",
  },
  "assign-scholarship-full": {
    title: "How do I assign a full scholarship?",
    description: "Full scholarship",
  },
  "enable-mercadopago": {
    title: "How do I enable Mercado Pago?",
    description: "MP walkthrough",
  },
  "enable-flow": {
    title: "How do I enable Flow Chile?",
    description: "Flow walkthrough",
  },
  "change-billing-currency": {
    title: "How do I change billing currency?",
    description: "Currency walkthrough",
  },
  "approve-event-payment": {
    title: "How do I approve an event payment?",
    description: "Event payment walkthrough",
  },
  "assign-section-scholarship-bulk": {
    title: "How do I assign bulk scholarships in a section?",
    description: "Bulk scholarship walkthrough",
  },
  "change-site-setup-currency": {
    title: "How do I set billing currency in Site setup?",
    description: "Site setup currency walkthrough",
  },
  "create-blog-article": {
    title: "How do I create a blog article?",
    description: "Blog walkthrough",
  },
  "create-blog-article-as-teacher": {
    title: "How do I submit a blog article for review (teacher)?",
    description: "Teacher blog walkthrough",
  },
  "reset-user-password": {
    title: "How do I reset a user password?",
    description: "Password walkthrough",
  },
  "import-users": {
    title: "How do I import users from a spreadsheet?",
    description: "Import walkthrough",
  },
};

const catalogGroupsDict = {
  academic: "Academic",
  billing: "Billing",
  users: "Users",
  content: "Content",
};

const toursDict = {
  createCohort: {
    doneBtn: "Done",
    nextBtn: "Next",
    prevBtn: "Back",
    closeBtn: "Close",
    progressText: "{{current}} of {{total}}",
    steps: {
      navAcademic: { title: "Nav", description: "d" },
      newCohort: { title: "New", description: "d" },
      nameField: { title: "Name", description: "d" },
      submit: { title: "Submit", description: "d" },
      detail: { title: "Detail", description: "d" },
    },
  },
};

function renderLauncher() {
  return render(
    <AdminHelpLauncher
      locale="es"
      launcherDict={launcherDict}
      catalogDict={catalogDict}
      catalogGroupsDict={catalogGroupsDict}
      toursDict={toursDict as never}
      explainScreenDict={explainScreenDict}
      screenToursDict={screenToursDict as never}
    />,
  );
}

describe("AdminHelpLauncher", () => {
  beforeEach(() => {
    push.mockClear();
    startTutorial.mockClear();
    startExplain.mockClear();
    useAppSurface.mockReturnValue("web-desktop");
  });

  it("does not render on PWA / narrow surfaces", () => {
    useAppSurface.mockReturnValue("pwa-mobile");
    renderLauncher();
    expect(screen.queryByRole("button", { name: launcherDict.fabAria })).toBeNull();
  });

  it("FAB opens panel with explain CTA and a Play per tutorial row", async () => {
    const user = userEvent.setup();
    renderLauncher();

    await user.click(screen.getByRole("button", { name: launcherDict.fabAria }));
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "false");
    expect(
      screen.getByRole("button", { name: "Explain this screen: Admin home" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start tutorial: How do I create a cohort?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start tutorial: How do I create a section?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start tutorial: How do I create a student?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start tutorial: How do I create a teacher?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start tutorial: How do I create an admin?" }),
    ).toBeInTheDocument();
  });

  it("Explain CTA dispatches startExplainScreenTour", async () => {
    const user = userEvent.setup();
    renderLauncher();

    await user.click(screen.getByRole("button", { name: launcherDict.fabAria }));
    await user.click(screen.getByRole("button", { name: "Explain this screen: Admin home" }));
    expect(startExplain).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "es", pathname: "/es/dashboard/admin" }),
    );
  });

  it("Play dispatches startAdminTutorial for that row id", async () => {
    const user = userEvent.setup();
    renderLauncher();

    await user.click(screen.getByRole("button", { name: launcherDict.fabAria }));
    await user.click(
      screen.getByRole("button", { name: "Start tutorial: How do I create a cohort?" }),
    );
    expect(startTutorial).toHaveBeenCalledWith(
      expect.objectContaining({ id: "create-cohort", locale: "es" }),
    );
  });

  it("clears Play busy when Help panel is reopened while start is still pending", async () => {
    const user = userEvent.setup();
    let resolveStart: (() => void) | undefined;
    startTutorial.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveStart = resolve;
        }),
    );

    renderLauncher();

    await user.click(screen.getByRole("button", { name: launcherDict.fabAria }));
    await user.click(
      screen.getByRole("button", { name: "Start tutorial: How do I create a cohort?" }),
    );

    await user.click(screen.getByRole("button", { name: launcherDict.fabAria }));
    const play = screen.getByRole("button", {
      name: "Start tutorial: How do I create a cohort?",
    });
    expect(play).not.toBeDisabled();
    expect(play.querySelector(".animate-spin")).toBeNull();

    resolveStart?.();
  });
});

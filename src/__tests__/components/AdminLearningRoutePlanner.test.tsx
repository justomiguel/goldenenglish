import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  saveLearningRouteAction,
  saveLearningRouteGraphAction,
} from "@/app/[locale]/dashboard/admin/academic/contents/actions";
import { AdminLearningRoutePlanner } from "@/components/admin/AdminLearningRoutePlanner";
import type { LearningRouteWorkspace } from "@/lib/learning-content/loadLearningRouteWorkspace";
import { dictEn } from "@/test/dictEn";

const routerMock = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@xyflow/react", async () => {
  const React = await import("react");
  return {
    ReactFlowProvider: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    ReactFlow: ({ children }: { children: ReactNode }) => <div data-testid="route-flow">{children}</div>,
    Background: () => <div />,
    Controls: () => <div />,
    MiniMap: () => <div />,
    useReactFlow: () => ({ screenToFlowPosition: (position: { x: number; y: number }) => position }),
    useNodesState: <T,>(initial: T[]) => {
      const [state, setState] = React.useState(initial);
      return [state, setState, vi.fn()] as const;
    },
    useEdgesState: <T,>(initial: T[]) => {
      const [state, setState] = React.useState(initial);
      return [state, setState, vi.fn()] as const;
    },
    addEdge: (edge: unknown, edges: unknown[]) => [...edges, edge],
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/app/[locale]/dashboard/admin/academic/contents/actions", () => ({
  addLearningRouteStepAction: vi.fn(),
  createQuestionBankItemAction: vi.fn(),
  saveLearningRouteAction: vi.fn(),
  saveLearningRouteGraphAction: vi.fn(),
}));

const workspace: LearningRouteWorkspace = {
  route: {
    id: "00000000-0000-4000-8000-000000000001",
    title: "A1 route",
    teacherObjectives: "",
    generalScope: "",
    evaluationCriteria: "",
    status: "draft",
  },
  routeSteps: [{
    id: "00000000-0000-4000-8000-000000000002",
    contentTemplateId: "00000000-0000-4000-8000-000000000003",
    contentTitle: "Greetings",
    title: "Greetings",
    sortOrder: 0,
    stepKind: "lesson",
    isRequired: true,
    positionX: 0,
    positionY: 120,
  }],
  routeEdges: [],
  routeCheckpoints: [],
  contentTemplates: [{
    id: "00000000-0000-4000-8000-000000000003",
    title: "Greetings",
    description: "Introductions",
  }],
  questions: [],
  assessments: [],
  health: {
    missingObjectives: true,
    missingEntryAssessment: false,
    missingExitAssessment: false,
    needsSupportCount: 0,
    teacherOverrideCount: 0,
  },
};

describe("AdminLearningRoutePlanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("opens the visual route steps editor from the route steps panel", async () => {
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;
    render(<AdminLearningRoutePlanner locale="en" workspace={workspace} labels={labels} />);

    await user.click(screen.getByRole("button", { name: labels.editRouteSteps }));

    expect(screen.getByRole("dialog", { name: labels.routeGraphModalTitle })).toBeInTheDocument();
    expect(screen.getByText(labels.routeGraphRepositoryTitle)).toBeInTheDocument();
    expect(screen.getByTestId("route-flow")).toBeInTheDocument();
  });

  it("shows the first wizard step for a new route", () => {
    const labels = dictEn.dashboard.adminContents;
    render(
      <AdminLearningRoutePlanner
        locale="en"
        workspace={{ ...workspace, route: null, routeSteps: [] }}
        labels={labels}
      />,
    );

    expect(screen.getByText(labels.routeWizardDetailsTitle)).toBeInTheDocument();
    expect(screen.getByText(labels.routeWizardStepDetails)).toBeInTheDocument();
    expect(screen.getByText(labels.routeWizardStepGraph)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: labels.editRouteSteps })).not.toBeInTheDocument();
  });

  it("saves a new route as the wizard first step and opens the graph step", async () => {
    vi.mocked(saveLearningRouteAction).mockResolvedValue({
      ok: true,
      id: "00000000-0000-4000-8000-000000000099",
    });
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;
    render(
      <AdminLearningRoutePlanner
        locale="en"
        workspace={{ ...workspace, route: null, routeSteps: [] }}
        labels={labels}
      />,
    );

    await user.type(screen.getByPlaceholderText(labels.routeNamePlaceholder), "A2 route");
    await user.click(screen.getByRole("button", { name: labels.nextToRouteGraph }));

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith(
        "/en/dashboard/admin/academic/contents/sections/00000000-0000-4000-8000-000000000099/edit?graph=1",
      );
    });
  });

  it("shows a specific wizard creation error when the schema is not ready", async () => {
    vi.mocked(saveLearningRouteAction).mockResolvedValue({ ok: false, code: "schema_not_ready" });
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;
    render(
      <AdminLearningRoutePlanner
        locale="en"
        workspace={{ ...workspace, route: null, routeSteps: [] }}
        labels={labels}
      />,
    );

    await user.type(screen.getByPlaceholderText(labels.routeNamePlaceholder), "A2 route");
    await user.click(screen.getByRole("button", { name: labels.nextToRouteGraph }));

    expect(await screen.findByText(labels.routeWizardSaveErrorSchemaNotReady)).toBeInTheDocument();
    expect(routerMock.replace).not.toHaveBeenCalled();
  });

  it("can auto-open the graph step and finish back to the route list", async () => {
    vi.mocked(saveLearningRouteGraphAction).mockResolvedValue({ ok: true });
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;
    render(<AdminLearningRoutePlanner locale="en" workspace={workspace} labels={labels} initialGraphOpen />);

    expect(screen.getByRole("dialog", { name: labels.routeGraphModalTitle })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: labels.routeGraphFinish }));

    await waitFor(() => {
      expect(routerMock.replace).toHaveBeenCalledWith("/en/dashboard/admin/academic/contents/sections");
    });
  });
});

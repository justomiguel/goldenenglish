import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AdminLearningRoutePlanner } from "@/components/admin/AdminLearningRoutePlanner";
import type { LearningRouteWorkspace } from "@/lib/learning-content/loadLearningRouteWorkspace";
import { dictEn } from "@/test/dictEn";

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
  it("opens the visual route steps editor from the route steps panel", async () => {
    const user = userEvent.setup();
    const labels = dictEn.dashboard.adminContents;
    render(<AdminLearningRoutePlanner locale="en" workspace={workspace} labels={labels} />);

    await user.click(screen.getByRole("button", { name: labels.editRouteSteps }));

    expect(screen.getByRole("dialog", { name: labels.routeGraphModalTitle })).toBeInTheDocument();
    expect(screen.getByText(labels.routeGraphRepositoryTitle)).toBeInTheDocument();
    expect(screen.getByTestId("route-flow")).toBeInTheDocument();
  });
});

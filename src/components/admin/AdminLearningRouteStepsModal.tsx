"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";
import { Save, X } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { Modal } from "@/components/atoms/Modal";
import { saveLearningRouteGraphAction } from "@/app/[locale]/dashboard/admin/academic/contents/actions";
import { LearningRouteCheckpointEditor, type RouteCheckpointDraft } from "@/components/admin/LearningRouteCheckpointEditor";
import { LearningRouteGraphCanvas, useRouteGraphState, type RouteGraphEdge, type RouteGraphNode } from "@/components/admin/LearningRouteGraphCanvas";
import { LearningRouteRepositorySearch } from "@/components/admin/LearningRouteRepositorySearch";
import type { LearningRouteWorkspace } from "@/lib/learning-content/loadLearningRouteWorkspace";
import type { Dictionary } from "@/types/i18n";

interface AdminLearningRouteStepsModalProps {
  open: boolean;
  locale: string;
  workspace: LearningRouteWorkspace;
  labels: Dictionary["dashboard"]["adminContents"];
  onOpenChange: (open: boolean) => void;
}

export function AdminLearningRouteStepsModal({
  open,
  locale,
  workspace,
  labels,
  onOpenChange,
}: AdminLearningRouteStepsModalProps) {
  const router = useRouter();
  const titleId = useId();
  const routeId = workspace.route?.id;
  const initialNodes = useMemo(() => buildInitialNodes(workspace), [workspace]);
  const initialEdges = useMemo(() => buildInitialEdges(workspace), [workspace]);
  const graph = useRouteGraphState(initialNodes, initialEdges);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [checkpoints, setCheckpoints] = useState(() => buildInitialCheckpoints(workspace));
  const [saveError, setSaveError] = useState(false);
  const [isPending, startTransition] = useTransition();
  const selectedCheckpoint = selectedEdgeId ? checkpoints[selectedEdgeId] ?? defaultCheckpoint(selectedEdgeId) : null;

  if (!routeId) return null;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      titleId={titleId}
      title={labels.routeGraphModalTitle}
      disableClose={isPending}
      dialogClassName="max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)]"
    >
      <div className="grid min-h-[calc(100dvh-10rem)] gap-4 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <LearningRouteRepositorySearch templates={workspace.contentTemplates} labels={labels} />
        <div className="flex min-w-0 flex-col gap-3">
          <ReactFlowProvider>
            <LearningRouteGraphCanvas
              nodes={graph.nodes}
              edges={graph.edges}
              labels={labels}
              onNodesChange={graph.onNodesChange}
              onEdgesChange={graph.onEdgesChange}
              onNodesReplace={graph.setNodes}
              onEdgesReplace={graph.setEdges}
              onSelectedEdge={setSelectedEdgeId}
            />
          </ReactFlowProvider>
          <LearningRouteCheckpointEditor
            checkpoint={selectedCheckpoint}
            labels={labels}
            onChange={(checkpoint) => setCheckpoints((current) => ({ ...current, [checkpoint.edgeId]: checkpoint }))}
          />
          {saveError ? <p className="text-sm font-medium text-[var(--color-error)]" role="alert">{labels.routeGraphSaveError}</p> : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" disabled={isPending} onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" aria-hidden />
              {labels.cancel}
            </Button>
            <Button
              type="button"
              isLoading={isPending}
              disabled={isPending}
              onClick={() => {
                setSaveError(false);
                startTransition(() => {
                  void (async () => {
                    const result = await saveLearningRouteGraphAction(buildPayload(locale, routeId, graph.nodes, graph.edges, checkpoints));
                    if (!result.ok) {
                      setSaveError(true);
                      return;
                    }
                    onOpenChange(false);
                    router.replace(`/${locale}/dashboard/admin/academic/contents/sections`);
                    router.refresh();
                  })();
                });
              }}
            >
              <Save className="h-4 w-4" aria-hidden />
              {labels.routeGraphFinish}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function buildInitialNodes(workspace: LearningRouteWorkspace): RouteGraphNode[] {
  return workspace.routeSteps.map((step, index) => ({
    id: step.id,
    type: "default",
    position: {
      x: step.positionX || index * 260,
      y: step.positionY || 120,
    },
    data: {
      contentTemplateId: step.contentTemplateId,
      title: step.contentTitle,
      label: step.contentTitle,
      sortOrder: step.sortOrder,
      stepKind: "lesson",
      isRequired: step.isRequired,
    },
  }));
}

function buildInitialEdges(workspace: LearningRouteWorkspace): RouteGraphEdge[] {
  return workspace.routeEdges.map((edge) => ({
    id: edge.id,
    source: edge.fromStepId,
    target: edge.toStepId,
    type: "smoothstep",
    label: edge.label || undefined,
    data: { conditionKind: edge.conditionKind },
  }));
}

function buildInitialCheckpoints(workspace: LearningRouteWorkspace): Record<string, RouteCheckpointDraft> {
  return Object.fromEntries(workspace.routeCheckpoints.map((checkpoint) => [
    checkpoint.edgeId,
    {
      id: checkpoint.id,
      edgeId: checkpoint.edgeId,
      assessmentId: checkpoint.assessmentId,
      enabled: checkpoint.assessmentId !== null,
      title: checkpoint.assessmentTitle ?? "",
      assessmentKind: (checkpoint.assessmentKind as RouteCheckpointDraft["assessmentKind"]) ?? "mini_test",
      gradingMode: checkpoint.gradingMode ?? "diagnostic",
      instructions: "",
      isRequired: checkpoint.isRequired,
      isPriority: checkpoint.isPriority,
      blocksProgress: checkpoint.blocksProgress,
      maxScore: checkpoint.maxScore,
      passingScore: checkpoint.passingScore,
      weight: checkpoint.weight,
    },
  ]));
}

function defaultCheckpoint(edgeId: string): RouteCheckpointDraft {
  return {
    edgeId,
    enabled: false,
    title: "",
    assessmentKind: "mini_test",
    gradingMode: "diagnostic",
    instructions: "",
    isRequired: false,
    isPriority: false,
    blocksProgress: false,
    maxScore: null,
    passingScore: null,
    weight: null,
  };
}

function buildPayload(
  locale: string,
  routeId: string,
  nodes: RouteGraphNode[],
  edges: RouteGraphEdge[],
  checkpoints: Record<string, RouteCheckpointDraft>,
) {
  return {
    locale,
    routeId,
    nodes: nodes.map((node, index) => ({
      id: node.id,
      contentTemplateId: node.data.contentTemplateId,
      sortOrder: index,
      stepKind: node.data.stepKind,
      isRequired: node.data.isRequired,
      positionX: node.position.x,
      positionY: node.position.y,
    })),
    edges: edges.map((edge, index) => ({
      id: edge.id,
      fromStepId: edge.source,
      toStepId: edge.target,
      sortOrder: index,
      label: typeof edge.label === "string" ? edge.label : "",
      conditionKind: edge.data?.conditionKind ?? "default",
    })),
    checkpoints: Object.values(checkpoints).filter((checkpoint) => edges.some((edge) => edge.id === checkpoint.edgeId)),
  };
}

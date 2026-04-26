"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  type EdgeChange,
} from "@xyflow/react";
import type { LearningRouteContentTemplateOption } from "@/types/learningContent";
import type { Dictionary } from "@/types/i18n";

export type RouteGraphNodeData = Record<string, unknown> & {
  contentTemplateId: string;
  title: string;
  label: string;
  sortOrder: number;
  stepKind: "lesson" | "unit" | "review" | "exam_prep" | "remediation";
  isRequired: boolean;
};

export type RouteGraphNode = Node<RouteGraphNodeData>;
export type RouteGraphEdge = Edge<Record<string, unknown> & { label?: string; conditionKind?: string }>;

interface LearningRouteGraphCanvasProps {
  nodes: RouteGraphNode[];
  edges: RouteGraphEdge[];
  labels: Dictionary["dashboard"]["adminContents"];
  onNodesChange: (changes: NodeChange<RouteGraphNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<RouteGraphEdge>[]) => void;
  onNodesReplace: (nodes: RouteGraphNode[]) => void;
  onEdgesReplace: (edges: RouteGraphEdge[]) => void;
  onSelectedEdge: (edgeId: string | null) => void;
}

export function LearningRouteGraphCanvas({
  nodes,
  edges,
  labels,
  onNodesChange,
  onEdgesChange,
  onNodesReplace,
  onEdgesReplace,
  onSelectedEdge,
}: LearningRouteGraphCanvasProps) {
  const flow = useReactFlow<RouteGraphNode, RouteGraphEdge>();

  return (
    <div
      className="min-h-[34rem] overflow-hidden rounded-[var(--layout-border-radius)] border border-[var(--color-border)] bg-[var(--color-background)]"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(event) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData("application/x-learning-content-template");
        if (!raw) return;
        const template = JSON.parse(raw) as LearningRouteContentTemplateOption;
        const position = flow.screenToFlowPosition({ x: event.clientX, y: event.clientY });
        onNodesReplace([
          ...nodes,
          {
            id: crypto.randomUUID(),
            type: "default",
            position,
            data: {
              contentTemplateId: template.id,
              title: template.title,
              label: template.title,
              sortOrder: nodes.length,
              stepKind: "lesson",
              isRequired: true,
            },
          },
        ]);
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={(connection: Connection) => {
          onEdgesReplace(addEdge({
            ...connection,
            id: crypto.randomUUID(),
            type: "smoothstep",
            animated: false,
            data: { conditionKind: "default" },
          }, edges));
        }}
        onEdgeClick={(_, edge) => onSelectedEdge(edge.id)}
        onPaneClick={() => onSelectedEdge(null)}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap pannable zoomable ariaLabel={labels.routeGraphMinimapAria} />
      </ReactFlow>
    </div>
  );
}

export function useRouteGraphState(initialNodes: RouteGraphNode[], initialEdges: RouteGraphEdge[]) {
  const [nodes, setNodes, onNodesChange] = useNodesState<RouteGraphNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<RouteGraphEdge>(initialEdges);
  return { nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange };
}

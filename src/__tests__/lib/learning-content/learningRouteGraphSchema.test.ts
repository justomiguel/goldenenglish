import { describe, expect, it } from "vitest";
import { LearningRouteGraphSchema } from "@/lib/learning-content/contentsActionsSchemas";

const routeId = "00000000-0000-4000-8000-000000000001";
const fromStepId = "00000000-0000-4000-8000-000000000002";
const toStepId = "00000000-0000-4000-8000-000000000003";
const templateId = "00000000-0000-4000-8000-000000000004";
const edgeId = "00000000-0000-4000-8000-000000000005";

describe("LearningRouteGraphSchema", () => {
  it("accepts a directed graph with an enabled gradebook checkpoint", () => {
    const parsed = LearningRouteGraphSchema.safeParse({
      locale: "en",
      routeId,
      nodes: [
        { id: fromStepId, contentTemplateId: templateId, sortOrder: 0, positionX: 0, positionY: 0 },
        { id: toStepId, contentTemplateId: templateId, sortOrder: 1, positionX: 250, positionY: 0 },
      ],
      edges: [{ id: edgeId, fromStepId, toStepId, sortOrder: 0 }],
      checkpoints: [{
        edgeId,
        enabled: true,
        title: "Checkpoint 1",
        isPriority: true,
        maxScore: 100,
        passingScore: 70,
      }],
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects edges that point to missing nodes", () => {
    const parsed = LearningRouteGraphSchema.safeParse({
      locale: "en",
      routeId,
      nodes: [{ id: fromStepId, contentTemplateId: templateId, sortOrder: 0, positionX: 0, positionY: 0 }],
      edges: [{ id: edgeId, fromStepId, toStepId, sortOrder: 0 }],
      checkpoints: [],
    });

    expect(parsed.success).toBe(false);
  });
});

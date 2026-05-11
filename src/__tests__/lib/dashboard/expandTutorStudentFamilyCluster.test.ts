import { describe, it, expect } from "vitest";
import { expandTutorStudentFamilyClusterFromEdges } from "@/lib/dashboard/expandTutorStudentFamilyCluster";

describe("expandTutorStudentFamilyClusterFromEdges", () => {
  it("returns seed alone when no edges", () => {
    expect(expandTutorStudentFamilyClusterFromEdges("a", [])).toEqual(["a"]);
  });

  it("walks tutor ↔ student links as undirected component", () => {
    const edges = [
      { tutor_id: "t1", student_id: "s1" },
      { tutor_id: "t1", student_id: "s2" },
      { tutor_id: "t2", student_id: "s2" },
    ] as const;
    expect(new Set(expandTutorStudentFamilyClusterFromEdges("t1", edges))).toEqual(new Set(["t1", "s1", "s2", "t2"]));
    expect(new Set(expandTutorStudentFamilyClusterFromEdges("s2", edges))).toEqual(new Set(["t1", "s1", "s2", "t2"]));
  });
});

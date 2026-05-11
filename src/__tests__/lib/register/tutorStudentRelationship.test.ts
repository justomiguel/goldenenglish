import { describe, it, expect } from "vitest";
import {
  TUTOR_STUDENT_RELATIONSHIP_CODES,
  isTutorStudentRelationshipCode,
} from "@/lib/register/tutorStudentRelationship";

describe("tutorStudentRelationship", () => {
  it("lists stable relationship codes", () => {
    expect(TUTOR_STUDENT_RELATIONSHIP_CODES).toContain("mother");
    expect(TUTOR_STUDENT_RELATIONSHIP_CODES).toContain("other");
  });

  it("narrows with isTutorStudentRelationshipCode", () => {
    expect(isTutorStudentRelationshipCode("mother")).toBe(true);
    expect(isTutorStudentRelationshipCode("not-a-code")).toBe(false);
  });
});

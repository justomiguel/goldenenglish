import { describe, expect, it } from "vitest";
import { assembleStudentCourses } from "@/lib/courses/assembleStudentCourses";

const sectionId = "11111111-1111-4111-8111-111111111111";

describe("assembleStudentCourses", () => {
  it("hides a draft and locks the second lesson until the first is done", () => {
    const cards = assembleStudentCourses({
      activeEnrollmentSectionIds: [sectionId],
      courses: [
        {
          id: "draft",
          title: "Hidden",
          published: false,
          progressMode: "open",
          grantingSectionIds: [sectionId],
          personalGrant: null,
          modules: [],
        },
        {
          id: "seq",
          title: "Sequence",
          published: true,
          progressMode: "sequential",
          grantingSectionIds: [sectionId],
          personalGrant: "purchase",
          modules: [
            {
              id: "m1",
              title: "Module",
              sortOrder: 0,
              lessons: [
                { id: "l1", title: "One", sortOrder: 0, completed: false },
                { id: "l2", title: "Two", sortOrder: 1, completed: false },
              ],
            },
          ],
        },
      ],
    });

    expect(cards).toHaveLength(1);
    expect(cards[0]?.origins).toEqual(["section", "purchase"]);
    expect(cards[0]?.modules[0]?.lessons.map((lesson) => lesson.unlocked)).toEqual([true, false]);
  });
});

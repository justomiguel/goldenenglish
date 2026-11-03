import { describe, expect, it } from "vitest";
import { normalizeHashtag, parseHashtagList } from "@/lib/courses/catalogHashtag";
import { parseCatalogMaterialKind } from "@/lib/courses/catalogMaterial";
import { mapCourseCategories, mapCourseFields } from "@/lib/courses/loadCourseCatalogSetup";
import { applyContentTemplateCatalogFilter, contentTemplateCatalogSelect } from "@/lib/learning-tasks/contentTemplateCatalogSelect";
import { categoryParentCreatesCycle } from "@/lib/courses/categoryCycle";
import { courseFieldSubmissionIsValid, parseFieldOptionLabels } from "@/lib/courses/courseFieldValues";
import { isProgramSetComplete, nextLockedCourseId } from "@/lib/courses/programSetCompletion";

describe("catalog hashtags", () => {
  it("folds accents, drops the hash, and rejects junk", () => {
    expect(normalizeHashtag(" #Gramática ")).toBe("gramatica");
    expect(normalizeHashtag("a")).toBe("a");
    expect(normalizeHashtag("#")).toBeNull();
    expect(normalizeHashtag("-nope")).toBeNull();
  });

  it("keeps ten unique labels", () => {
    const raw = "A1 a1 #A2 b, c d e f g h i j extra";
    expect(parseHashtagList(raw)).toEqual(["a1", "a2", "b", "c", "d", "e", "f", "g", "h", "i"]);
  });
});

describe("catalog material", () => {
  it("accepts the five kinds only", () => {
    expect(parseCatalogMaterialKind("pdf")).toBe("pdf");
    expect(parseCatalogMaterialKind("page")).toBeNull();
    expect(parseCatalogMaterialKind(undefined)).toBeNull();
  });
});

describe("category cycle", () => {
  it("rejects a parent that points back at the category", () => {
    const parents = new Map<string, string | null>([
      ["a", null],
      ["b", "a"],
    ]);
    expect(categoryParentCreatesCycle("a", "b", parents)).toBe(true);
    expect(categoryParentCreatesCycle("b", "a", parents)).toBe(false);
  });
});

describe("course field values", () => {
  const defs = [
    { id: "t", kind: "text" as const, required: true, optionIds: [] },
    { id: "d", kind: "dropdown" as const, required: false, optionIds: ["opt"] },
    { id: "c", kind: "checkbox" as const, required: true, optionIds: [] },
    { id: "day", kind: "date" as const, required: false, optionIds: [] },
  ];

  it("accepts a complete submission", () => {
    expect(
      courseFieldSubmissionIsValid(defs, [
        { fieldId: "t", text: "hola" },
        { fieldId: "d", optionId: "opt" },
        { fieldId: "c", checked: true },
        { fieldId: "day", date: "2026-11-02" },
      ]),
    ).toBe(true);
  });

  it("splits list options and drops blanks", () => {
    expect(parseFieldOptionLabels("Uno; Dos\nUno\n")).toEqual(["Uno", "Dos"]);
  });

  it("rejects a missing required field and an unknown option", () => {
    expect(courseFieldSubmissionIsValid(defs, [{ fieldId: "c", checked: true }])).toBe(false);
    expect(
      courseFieldSubmissionIsValid(defs, [
        { fieldId: "t", text: "hola" },
        { fieldId: "d", optionId: "nope" },
        { fieldId: "c", checked: true },
      ]),
    ).toBe(false);
  });
});

describe("catalog query shape", () => {
  it("keeps the default select free of inner joins", () => {
    const plain = contentTemplateCatalogSelect({ tag: false, material: false });
    expect(plain.list).not.toContain("!inner");
    expect(plain.count).toBe("id");
    const filtered = contentTemplateCatalogSelect({ tag: true, material: true });
    expect(filtered.list).toContain("content_template_hashtags!inner");
    expect(filtered.list).toContain("content_template_blocks!inner");
  });

  it("adds the hashtag and material predicates only when they are set", () => {
    const calls: string[] = [];
    const query = {
      eq(column: string, value: string) {
        calls.push(`${column}=${value}`);
        return query;
      },
    };
    applyContentTemplateCatalogFilter(query, { hashtagId: null, material: null });
    applyContentTemplateCatalogFilter(query, { hashtagId: "h1", material: "pdf" });
    expect(calls).toEqual(["content_template_hashtags.hashtag_id=h1", "content_template_blocks.kind=pdf"]);
  });

  it("maps category and field rows", () => {
    expect(mapCourseCategories([{ id: "c", parent_id: null, name: "A1" }])).toEqual([{ id: "c", parentId: null, name: "A1" }]);
    expect(
      mapCourseFields([
        {
          id: "f",
          name: "Nivel",
          kind: "dropdown",
          required: false,
          course_field_options: [
            { id: "b", label: "B", sort_order: 2 },
            { id: "a", label: "A", sort_order: 1 },
          ],
        },
      ])[0]?.options.map((option) => option.label),
    ).toEqual(["A", "B"]);
  });
});

describe("program set completion", () => {
  it("locks the next course when the set is in order", () => {
    const completed = new Set(["a"]);
    expect(
      nextLockedCourseId({
        completion: "all_in_order",
        courseIdsInOrder: ["a", "b"],
        completedCourseIds: completed,
      }),
    ).toBe("b");
    expect(
      isProgramSetComplete({
        completion: "at_least",
        atLeastCount: 1,
        courseIdsInOrder: ["a", "b"],
        completedCourseIds: completed,
      }),
    ).toBe(true);
  });
});

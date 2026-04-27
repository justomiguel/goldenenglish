import { describe, expect, it } from "vitest";
import {
  buildIlikePrefixPattern,
  escapeForIlikePattern,
  normalizePersonSearchText,
  personNameFieldsMatchPrefix,
  personProfileMatchPrefix,
} from "@/lib/users/profileSearchPrefix";

describe("profileSearchPrefix", () => {
  it("normalizePersonSearchText folds accents", () => {
    expect(normalizePersonSearchText("  José  ")).toBe("jose");
  });

  it("escapeForIlikePattern escapes wildcards", () => {
    expect(escapeForIlikePattern("a%b_c\\")).toBe("a\\%b\\_c\\\\");
  });

  it("buildIlikePrefixPattern appends single wildcard", () => {
    expect(buildIlikePrefixPattern("Mar")).toBe("Mar%");
    expect(buildIlikePrefixPattern("  x  ")).toBe("x%");
  });

  it("personNameFieldsMatchPrefix is true for empty query", () => {
    expect(personNameFieldsMatchPrefix({ first_name: "A", last_name: "B" }, "  ")).toBe(true);
  });

  it("personNameFieldsMatchPrefix matches first or last or full prefix", () => {
    expect(personNameFieldsMatchPrefix({ first_name: "María", last_name: "García" }, "mar")).toBe(true);
    expect(personNameFieldsMatchPrefix({ first_name: "María", last_name: "García" }, "gar")).toBe(true);
    expect(personNameFieldsMatchPrefix({ first_name: "María", last_name: "García" }, "maría g")).toBe(true);
    expect(personNameFieldsMatchPrefix({ first_name: "María", last_name: "García" }, "ía")).toBe(false);
  });

  it("personProfileMatchPrefix includes document prefix", () => {
    expect(
      personProfileMatchPrefix(
        { first_name: "X", last_name: "Y", dni_or_passport: "AB123" },
        "ab1",
      ),
    ).toBe(true);
    expect(
      personProfileMatchPrefix(
        { first_name: "X", last_name: "Y", dni_or_passport: "AB123" },
        "b1",
      ),
    ).toBe(false);
  });
});

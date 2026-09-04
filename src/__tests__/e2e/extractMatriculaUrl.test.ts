/** @vitest-environment node */
import { describe, expect, it } from "vitest";
import { extractMatriculaUrlFromHtml } from "../../../e2e/helpers/extractMatriculaUrl";

describe("extractMatriculaUrlFromHtml", () => {
  it("reads the first /matricula/ href and decodes entities", () => {
    expect(
      extractMatriculaUrlFromHtml(
        `<a href="https://example.test/es/matricula/abc123">pay</a>`,
      ),
    ).toBe("https://example.test/es/matricula/abc123");
    expect(
      extractMatriculaUrlFromHtml(
        `<a href="https://example.test/es/matricula/tok&amp;x=1">pay</a>`,
      ),
    ).toBe("https://example.test/es/matricula/tok&x=1");
  });

  it("returns null when there is no pay link", () => {
    expect(extractMatriculaUrlFromHtml("<p>no link</p>")).toBeNull();
  });
});

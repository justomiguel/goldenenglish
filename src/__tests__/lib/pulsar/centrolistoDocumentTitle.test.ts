// REGRESSION CHECK: A CentroListo title keeps the topic and the entity name once.
import { describe, expect, it } from "vitest";
import { centrolistoDocumentTitle } from "@/lib/pulsar/centrolistoDocumentTitle";

describe("centrolistoDocumentTitle", () => {
  it("adds the entity once", () => {
    expect(centrolistoDocumentTitle("Crea tu cuenta")).toBe("Crea tu cuenta | CentroListo");
  });

  it("does not emit centrolisto | CentroListo", () => {
    expect(centrolistoDocumentTitle("centrolisto")).toBe("CentroListo");
    expect(centrolistoDocumentTitle("centrolisto | CentroListo")).toBe("CentroListo");
    expect(centrolistoDocumentTitle("Crea tu cuenta | centrolisto")).toBe(
      "Crea tu cuenta | CentroListo",
    );
  });
});

import { describe, expect, it } from "vitest";
import {
  buildBadgeSharePath,
  buildBlogPreviewPath,
  buildEventPreviewPath,
  buildMatriculaPayPath,
  buildQuestionnaireSharePath,
  buildShopOrderPath,
  buildShopProductPath,
  parseCosmeticSecretSegments,
} from "@/lib/site/publicSharePaths";

describe("publicSharePaths", () => {
  it("builds readable paths and falls back when the name is empty", () => {
    expect(buildBadgeSharePath("es", "Primera clase", "tok")).toBe("/es/logro/primera-clase/tok");
    expect(buildBadgeSharePath("es", "!!!", "tok")).toBe("/es/logro/logro/tok");
    expect(buildQuestionnaireSharePath("es", "nps")).toBe("/es/encuesta/nps");
    expect(buildShopProductPath("es", "remera-negra")).toBe("/es/tienda/remera-negra");
    expect(buildShopOrderPath("es", "Remera", "pay")).toBe("/es/tienda/pedido/remera/pay");
    expect(buildShopOrderPath("es", "", "pay")).toBe("/es/tienda/pedido/pedido/pay");
    expect(buildMatriculaPayPath("es", "", "pay")).toBe("/es/matricula/pago/pay");
    expect(buildBlogPreviewPath("es", "borrador", "a.b")).toBe("/es/blog/vista-previa/borrador/a.b");
    expect(buildEventPreviewPath("es", "Taller de capoeira")).toBe(
      "/es/events/vista-previa/taller-de-capoeira",
    );
  });

  it("parses a secret path with or without a slug", () => {
    expect(parseCosmeticSecretSegments(["tok"])).toEqual({ slug: null, secret: "tok" });
    expect(parseCosmeticSecretSegments(["remera", "pay"])).toEqual({
      slug: "remera",
      secret: "pay",
    });
    expect(parseCosmeticSecretSegments([])).toBeNull();
  });
});

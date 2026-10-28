import { describe, expect, it } from "vitest";
import { buildCentrolistoLlmsTxt } from "@/lib/pulsar/centrolistoLlmsTxt";

describe("buildCentrolistoLlmsTxt", () => {
  it("maps the public pages and the contact questions", () => {
    const text = buildCentrolistoLlmsTxt({
      origin: "https://centrolisto.cl/",
      name: "centrolisto",
      tagline: "Para quienes abrieron una escuela por amor a enseñar",
      description: "Un lugar propio para tu escuela.",
      contactEmail: "contacto@centrolisto.cl",
      locales: [
        {
          code: "es",
          pages: [
            { path: "", title: "La jornada" },
            { path: "/producto", title: "El oficio detrás de la calma" },
            { path: "/clientes", title: "Escuelas y comunidades" },
            { path: "/contacto", title: "Conversar sin prisa" },
          ],
        },
      ],
      faqs: [{ q: "¿Ven el nombre de mi escuela?", a: "Ven siempre a tu escuela." }],
    });

    expect(text).toContain("# centrolisto");
    expect(text).toContain("[La jornada](https://centrolisto.cl/es)");
    expect(text).toContain("[El oficio detrás de la calma](https://centrolisto.cl/es/producto)");
    expect(text).toContain("contacto@centrolisto.cl");
    expect(text).toContain("### ¿Ven el nombre de mi escuela?");
    expect(text).not.toContain("/admin");
    expect(text).not.toContain("wa.me");
  });
});

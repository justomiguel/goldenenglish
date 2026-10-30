import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import pt from "@/dictionaries/pt.json";
import { PublicAnswerArticle } from "@/components/organisms/PublicAnswerArticle";
import { JsonLdFaqPage } from "@/components/molecules/JsonLdFaqPage";
import {
  buildFaqPageJsonLd,
  buildInstituteDepartments,
  instituteAnswerKindKey,
  isPublishablePublicContact,
  lioraPlacesFromSedes,
  withPublishableContact,
  type InstituteAnswerKindKey,
} from "@/lib/public/instituteAnswerPages";

const EXPECTED_IDS: Record<InstituteAnswerKindKey, readonly string[]> = {
  classic: [
    "age",
    "beginner",
    "modality",
    "live",
    "groups",
    "levels",
    "cambridge",
    "national",
    "where",
    "enroll",
  ],
  mozarthitos: ["age", "length", "method", "musician", "where", "online", "enroll"],
  espaciozenit: [
    "styles",
    "groups",
    "experience",
    "trial",
    "firstclass",
    "shows",
    "families",
    "contact",
  ],
  nago: ["experience", "ages", "whojoins", "more", "who", "where", "book"],
  mimundo: ["ages", "approach", "where", "colony", "team", "reserve"],
  liora: ["ages", "adults", "sites", "day", "trial", "uniform", "competitive", "groups"],
  generic: ["age", "schedule", "group", "enroll"],
};

const LOCALES = { en, es, pt } as const;

function joinedAnswers(kind: InstituteAnswerKindKey): string {
  return Object.values(LOCALES)
    .flatMap((dict) => dict.publicAnswers.kinds[kind].items.map((item) => `${item.q} ${item.a}`))
    .join("\n");
}

describe("institute answer pages", () => {
  it("maps editorial and minimal to the classic English answers", () => {
    expect(instituteAnswerKindKey("classic")).toBe("classic");
    expect(instituteAnswerKindKey("editorial")).toBe("classic");
    expect(instituteAnswerKindKey("minimal")).toBe("classic");
    expect(instituteAnswerKindKey("deportes")).toBe("generic");
    expect(instituteAnswerKindKey("jardin")).toBe("generic");
    expect(instituteAnswerKindKey("mozarthitos")).toBe("mozarthitos");
  });

  it("keeps the same question ids in en, es, and pt", () => {
    for (const kind of Object.keys(EXPECTED_IDS) as InstituteAnswerKindKey[]) {
      for (const dict of Object.values(LOCALES)) {
        expect(dict.publicAnswers.kinds[kind].items.map((item) => item.id)).toEqual([
          ...EXPECTED_IDS[kind],
        ]);
      }
    }
  });

  it("drops placeholder phone and email from the contact answer", () => {
    expect(isPublishablePublicContact("phone", "+56 9 0000 0000")).toBe(false);
    expect(isPublishablePublicContact("email", "hola@tuestudio.cl")).toBe(false);
    const items = withPublishableContact({
      items: es.publicAnswers.kinds.espaciozenit.items,
      brand: "Estudio",
      contactQuestion: es.publicAnswers.contactQuestion,
      contactLine: es.publicAnswers.contactLine,
      contactEmailOnly: es.publicAnswers.contactEmailOnly,
      contactPhoneOnly: es.publicAnswers.contactPhoneOnly,
      email: "hola@tuestudio.cl",
      phone: "+56 9 0000 0000",
    });
    expect(items).toHaveLength(es.publicAnswers.kinds.espaciozenit.items.length);
    expect(items.map((item) => item.a).join(" ")).not.toMatch(/0000|tuestudio/i);
  });

  it("adds a contact answer when the phone and email are real", () => {
    const items = withPublishableContact({
      items: es.publicAnswers.kinds.classic.items,
      brand: "Instituto",
      contactQuestion: es.publicAnswers.contactQuestion,
      contactLine: es.publicAnswers.contactLine,
      contactEmailOnly: es.publicAnswers.contactEmailOnly,
      contactPhoneOnly: es.publicAnswers.contactPhoneOnly,
      email: "hola@instituto.test",
      phone: "+54 9 3718 528-383",
    });
    expect(items.at(-1)).toMatchObject({
      id: "reach",
      a: "Escribe a hola@instituto.test o llama al +54 9 3718 528-383.",
    });
  });

  it("does not publish unconfirmed claims from other listings", () => {
    expect(joinedAnswers("espaciozenit")).not.toMatch(/0000|tuestudio|providencia/i);
    expect(joinedAnswers("espaciozenit")).toMatch(/Tegualda 1566/);
    expect(joinedAnswers("nago")).not.toMatch(/sin contacto|non-contact|sem contato/i);
    expect(joinedAnswers("mozarthitos")).not.toMatch(/hasta los 8|uma vez por semana|una vez por semana/i);
    expect(joinedAnswers("mimundo")).not.toMatch(/french 535|442-0905|lauriobregon/i);
  });

  it("answers People Also Ask questions without inventing fees or uniforms", () => {
    expect(es.publicAnswers.kinds.classic.items.map((item) => item.id)).toContain("beginner");
    expect(joinedAnswers("classic")).toMatch(/en vivo|live, not recorded|ao vivo/i);
    expect(joinedAnswers("espaciozenit")).toMatch(/ropa cómoda|comfortable clothes|roupa confortável/i);
    expect(joinedAnswers("nago")).toMatch(/niñas|girls|meninas/i);
    expect(joinedAnswers("liora")).toMatch(/clase de prueba|trial class|aula experimental/i);
    expect(joinedAnswers("classic")).not.toMatch(/\$\d|ARS|CLP/);
    expect(joinedAnswers("espaciozenit")).not.toMatch(/malla|media punta|maillot/i);
    expect(joinedAnswers("liora")).not.toMatch(/malla|media punta|maillot/i);
  });

  it("builds FAQPage JSON-LD from the visible answers", () => {
    const items = withPublishableContact({
      items: en.publicAnswers.kinds.nago.items,
      brand: "Grupo",
      contactQuestion: en.publicAnswers.contactQuestion,
      contactLine: en.publicAnswers.contactLine,
      contactEmailOnly: en.publicAnswers.contactEmailOnly,
      contactPhoneOnly: en.publicAnswers.contactPhoneOnly,
      email: "",
      phone: "",
    });
    const payload = buildFaqPageJsonLd(items);
    expect(payload["@type"]).toBe("FAQPage");
    expect(payload.mainEntity).toHaveLength(items.length);
    render(<JsonLdFaqPage items={items} />);
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script?.textContent).toContain('"@type":"FAQPage"');
    render(<PublicAnswerArticle title="Questions" lead="Short answers." items={items} />);
    expect(screen.getByRole("heading", { level: 1, name: "Questions" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: items[0]?.q })).toBeInTheDocument();
  });

  it("builds Liora department places from metro copy and skips other kinds", () => {
    const places = lioraPlacesFromSedes(es.landing.liora.sedes);
    expect(places.map((place) => place.name)).toEqual([
      "Providencia",
      "Maipú",
      "San Miguel",
    ]);
    const departments = buildInstituteDepartments("liora", places);
    expect(departments).toHaveLength(3);
    expect(departments[0]).toMatchObject({
      "@type": "Place",
      name: "Providencia",
      description: "A pasos del Metro Parque Bustamante",
    });
    expect(JSON.stringify(departments)).not.toMatch(/streetAddress|Seminario|130/);
    expect(buildInstituteDepartments("classic", places)).toEqual([]);
  });
});

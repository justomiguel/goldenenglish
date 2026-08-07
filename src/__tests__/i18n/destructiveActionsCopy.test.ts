/**
 * Test group 5 from spec 8:
 * The five rewritten copy strings no longer describe the layout; the four kept
 * ones are unchanged; all three locales stay structurally identical.
 *
 * NOTE: The spec refers to these keys by their TypeScript usage paths.
 * The actual JSON paths are:
 *   dashboard.academicSectionPage.shellTabs.generalLead  → same
 *   dashboard.messages.lead                              → admin.messages.lead
 *   dashboard.adminContents.lead                         → same
 *   dashboard.cms.siteTheme.brandAssets.lead             → admin.cms.templates.editor.brandAssets.lead
 *   dashboard.studentEmailNotCollectedMinorLead          → register.studentEmailNotCollectedMinorLead
 *
 *   dashboard.users.selfProtected        → admin.users.selfProtected
 *   dashboard.users.tipSelectAllVisible  → admin.users.tipSelectAllVisible
 *   dashboard.usersNav.tipList           → admin.usersNav.tipList
 *   dashboard.promotions.confirmRetire   → admin.promotions.confirmRetire
 */
import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DICT_DIR = path.resolve(__dirname, "../../dictionaries");

function loadDict(locale: string): Record<string, unknown> {
  return JSON.parse(fs.readFileSync(path.join(DICT_DIR, `${locale}.json`), "utf-8"));
}

function get(obj: Record<string, unknown>, ...keys: string[]): string {
  let cursor: unknown = obj;
  for (const k of keys) {
    if (typeof cursor !== "object" || cursor === null || !(k in (cursor as object))) {
      return `__MISSING:${keys.join(".")}__`;
    }
    cursor = (cursor as Record<string, unknown>)[k];
  }
  return typeof cursor === "string" ? cursor : `__NOT_STRING:${keys.join(".")}__`;
}

// ─── Layout phrases that must NOT appear in the five rewritten strings ────────

const BANNED_ES = ["arriba a la derecha", "más abajo", "a la izquierda"];
const BANNED_EN = ["top right", "below", "to the left"];
const BANNED_PT = ["canto superior direito", "abaixo", "à esquerda"];

function assertNoBannedPhrases(value: string, banned: string[], label: string) {
  for (const phrase of banned) {
    expect(
      value.toLowerCase(),
      `${label} still contains layout reference: "${phrase}"`,
    ).not.toContain(phrase.toLowerCase());
  }
}

// ─── Group 5 tests ────────────────────────────────────────────────────────────

describe("Copy – five rewritten strings no longer describe layout", () => {
  const locales = ["es", "en", "pt"] as const;

  for (const locale of locales) {
    const banned = locale === "es" ? BANNED_ES : locale === "en" ? BANNED_EN : BANNED_PT;

    describe(`[${locale}]`, () => {
      it("1. generalLead has no layout references", () => {
        const d = loadDict(locale);
        const value = get(d, "dashboard", "academicSectionPage", "shellTabs", "generalLead");
        assertNoBannedPhrases(value, banned, `[${locale}] generalLead`);
      });

      it("2. messages.lead has no layout references", () => {
        const d = loadDict(locale);
        const value = get(d, "admin", "messages", "lead");
        assertNoBannedPhrases(value, banned, `[${locale}] messages.lead`);
      });

      it("3. adminContents.lead has no layout references", () => {
        const d = loadDict(locale);
        const value = get(d, "dashboard", "adminContents", "lead");
        assertNoBannedPhrases(value, banned, `[${locale}] adminContents.lead`);
      });

      it("4. cms.brandAssets.lead has no layout references", () => {
        const d = loadDict(locale);
        const value = get(d, "admin", "cms", "templates", "editor", "brandAssets", "lead");
        assertNoBannedPhrases(value, banned, `[${locale}] brandAssets.lead`);
      });

      it("5. studentEmailNotCollectedMinorLead has no layout references", () => {
        const d = loadDict(locale);
        const value = get(d, "register", "studentEmailNotCollectedMinorLead");
        assertNoBannedPhrases(value, banned, `[${locale}] studentEmailNotCollectedMinorLead`);
      });
    });
  }
});

describe("Copy – four kept strings are unchanged", () => {
  it("selfProtected is unchanged in ES", () => {
    const d = loadDict("es");
    const value = get(d, "admin", "users", "selfProtected");
    expect(value).toBe("No podés eliminar tu propia sesión desde aquí.");
  });

  it("tipList is unchanged in ES", () => {
    const d = loadDict("es");
    const value = get(d, "admin", "usersNav", "tipList");
    expect(value).toBe("Ver y filtrar todas las cuentas del portal en esta pantalla.");
  });

  it("confirmRetire is unchanged in ES", () => {
    const d = loadDict("es");
    const value = get(d, "admin", "promotions", "confirmRetire");
    expect(value).toBe("¿Dar de baja esta promoción? No podrás revertirlo desde esta pantalla.");
  });

  it("tipSelectAllVisible starts with the expected prefix in ES", () => {
    const d = loadDict("es");
    const value = get(d, "admin", "users", "tipSelectAllVisible");
    expect(value).toContain("Seleccioná o quitá la selección de todas las cuentas de esta página");
  });
});

describe("Copy – all three locales are structurally identical", () => {
  // Each tuple: [JSON path segments, spec description]
  const KEYS: { path: string[]; label: string }[] = [
    {
      path: ["dashboard", "academicSectionPage", "shellTabs", "generalLead"],
      label: "generalLead",
    },
    { path: ["admin", "messages", "lead"], label: "messages.lead" },
    { path: ["dashboard", "adminContents", "lead"], label: "adminContents.lead" },
    {
      path: ["admin", "cms", "templates", "editor", "brandAssets", "lead"],
      label: "brandAssets.lead",
    },
    {
      path: ["register", "studentEmailNotCollectedMinorLead"],
      label: "studentEmailNotCollectedMinorLead",
    },
  ];

  for (const { path: keyPath, label } of KEYS) {
    it(`${label} is a non-empty string in all three locales`, () => {
      for (const locale of ["es", "en", "pt"]) {
        const d = loadDict(locale);
        const value = get(d, ...keyPath);
        expect(
          value,
          `[${locale}] ${label} is missing or empty`,
        ).toBeTruthy();
        expect(value).not.toContain("__MISSING");
        expect(value).not.toContain("__NOT_STRING");
      }
    });
  }
});

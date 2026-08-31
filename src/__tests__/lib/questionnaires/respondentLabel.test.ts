import { describe, expect, it } from "vitest";
import { questionnaireRespondentLabel } from "@/lib/questionnaires/respondentLabel";

describe("questionnaireRespondentLabel", () => {
  it("prefers profile name, then email, then anonymous", () => {
    expect(
      questionnaireRespondentLabel(
        { userId: "u", email: "x@y.com", displayName: "Pérez Ana" },
        "Anónimo",
      ),
    ).toBe("Pérez Ana");
    expect(
      questionnaireRespondentLabel({ userId: null, email: "x@y.com", displayName: null }, "Anónimo"),
    ).toBe("x@y.com");
    expect(
      questionnaireRespondentLabel({ userId: null, email: null, displayName: null }, "Anónimo"),
    ).toBe("Anónimo");
  });
});

import { describe, it, expect } from "vitest";
import { splitTutorDisplayName } from "@/lib/register/tutorDisplayNameParts";

const d = { defaultFirstName: "Tutor", emptyLastName: "—" };

describe("splitTutorDisplayName", () => {
  it("splits on first space", () => {
    expect(splitTutorDisplayName("María Pérez", d)).toEqual({
      firstName: "María",
      lastName: "Pérez",
    });
  });

  it("uses single token as first name", () => {
    expect(splitTutorDisplayName("Solo", d)).toEqual({ firstName: "Solo", lastName: "—" });
  });

  it("handles empty", () => {
    expect(splitTutorDisplayName(null, d)).toEqual({ firstName: "Tutor", lastName: "—" });
  });
});

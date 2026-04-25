import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminRetentionReasonsList } from "@/components/molecules/AdminRetentionReasonsList";

const dict = {
  reasonAbsences: "Absences reason",
  reasonLowAverage: "Low average reason",
};

describe("AdminRetentionReasonsList", () => {
  it("renders reasons in stable order with list semantics", () => {
    render(<AdminRetentionReasonsList reasons={["low_average", "absences"]} dict={dict} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("Absences reason");
    expect(items[1]).toHaveTextContent("Low average reason");
  });
});

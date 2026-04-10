import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormField } from "@/components/molecules/FormField";

describe("FormField", () => {
  it("shows error in alert region", () => {
    render(
      <FormField label="Email" name="email" error="Required" defaultValue="" />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  it("shows hint when no error", () => {
    render(
      <FormField label="Email" name="email" hint="We never share" defaultValue="" />,
    );
    expect(screen.getByText("We never share")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

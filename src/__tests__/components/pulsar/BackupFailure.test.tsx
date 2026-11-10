/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BackupFailure } from "@/components/organisms/pulsar/BackupFailure";

const errors = {
  slug_taken: "An institute with this id already exists. Close it before you import. Code: slug_taken",
};

describe("BackupFailure", () => {
  it("shows the sentence for a known code", () => {
    render(<BackupFailure code="slug_taken" errors={errors} />);
    expect(screen.getByRole("alert").textContent).toBe(errors.slug_taken);
  });

  it("shows an unknown code so the person can quote it", () => {
    render(<BackupFailure code="mystery_code" errors={errors} />);
    expect(screen.getByRole("alert").textContent).toBe("mystery_code");
  });
});

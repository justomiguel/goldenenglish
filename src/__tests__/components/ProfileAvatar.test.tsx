/** @vitest-environment jsdom */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";

describe("ProfileAvatar", () => {
  // REGRESSION CHECK: User lists and profile headers should keep the shared
  // illustrated fallback for accounts without photos instead of regressing to
  // initials-only placeholders.
  it("renders the default svg icon when the profile has no photo", () => {
    render(<ProfileAvatar url={null} displayName="Ada Lovelace" size="sm" />);

    expect(screen.getByTestId("default-profile-avatar-icon")).toBeInTheDocument();
    expect(screen.queryByText("AL")).not.toBeInTheDocument();
  });
});

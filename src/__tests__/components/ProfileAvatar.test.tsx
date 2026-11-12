/** @vitest-environment jsdom */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileAvatar } from "@/components/atoms/ProfileAvatar";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

const STORAGE_PATH = "0c2a6619-46c1-422d-a490-ec34fa94ce9d/cf50110b-c9f4-456a-b08c-6f4d1b578472.jpg";

describe("ProfileAvatar", () => {
  // REGRESSION CHECK: User lists and profile headers should keep the shared
  // illustrated fallback for accounts without photos instead of regressing to
  // initials-only placeholders. A private-bucket object path must not reach
  // next/image; that throw takes down the admin home error boundary.
  it("renders the default svg icon when the profile has no photo", () => {
    render(<ProfileAvatar url={null} displayName="Ada Lovelace" size="sm" />);

    expect(screen.getByTestId("default-profile-avatar-icon")).toBeInTheDocument();
    expect(screen.queryByText("AL")).not.toBeInTheDocument();
  });

  it("renders the default icon when the src is a storage object path", () => {
    render(<ProfileAvatar url={STORAGE_PATH} displayName="Ada Lovelace" size="sm" />);

    expect(screen.getByTestId("default-profile-avatar-icon")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Ada Lovelace" })).not.toBeInTheDocument();
  });

  it("renders an https photo", () => {
    render(
      <ProfileAvatar url="https://cdn.example/a.jpg" displayName="Ada Lovelace" size="sm" />,
    );

    expect(screen.getByRole("img", { name: "Ada Lovelace" })).toHaveAttribute(
      "src",
      "https://cdn.example/a.jpg",
    );
  });
});

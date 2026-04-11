import { describe, it } from "vitest";
import { render } from "@testing-library/react";
import { AdminUsersSkeleton } from "@/components/molecules/AdminUsersSkeleton";
import { AdminRegistrationsSkeleton } from "@/components/molecules/AdminRegistrationsSkeleton";

describe("admin list skeletons", () => {
  it("renders AdminUsersSkeleton", () => {
    render(<AdminUsersSkeleton />);
  });

  it("renders AdminRegistrationsSkeleton", () => {
    render(<AdminRegistrationsSkeleton />);
  });
});

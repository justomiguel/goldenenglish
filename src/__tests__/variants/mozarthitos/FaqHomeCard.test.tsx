import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { dictEn } from "@/test/dictEn";
import { FaqHomeCard } from "@/variants/owned/mozarthitos/pieces/FaqHomeCard";

describe("FaqHomeCard", () => {
  it("shows the people total and the open count beside the question", () => {
    render(
      <FaqHomeCard
        locale="en"
        dict={dictEn}
        model={{
          ok: true,
          visits: 6,
          rows: [{ id: "price", question: "How much is it?", opens: 4 }],
        }}
      />,
    );
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("How much is it?")).toBeInTheDocument();
    expect(screen.getByText("4")).toHaveAttribute("aria-label", "4 Opens");
  });

  it("shows each known failure code and leaves an unknown code visible", () => {
    const { rerender } = render(
      <FaqHomeCard locale="en" dict={dictEn} model={{ ok: false, code: "load_failed" }} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Code: load_failed");
    expect(screen.getByRole("alert")).not.toHaveTextContent("try again");

    rerender(
      <FaqHomeCard locale="en" dict={dictEn} model={{ ok: false, code: "stats_unavailable" }} />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Code: stats_unavailable");

    rerender(<FaqHomeCard locale="en" dict={dictEn} model={{ ok: false, code: "orbit_missing" }} />);
    expect(screen.getByRole("alert")).toHaveTextContent("orbit_missing");
  });
});

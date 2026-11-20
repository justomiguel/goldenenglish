import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import dictEs from "@/dictionaries/es.json";
import type { Dictionary } from "@/types/i18n";
import { MozarthitosFaqAccordion } from "@/variants/owned/mozarthitos/pieces/MozarthitosFaqAccordion";

const dict = dictEs as Dictionary;
const fetchMock = vi.fn();

describe("Mozarthitos FAQ metric", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
  });

  it("posts a visit on mount and an open when the question opens", async () => {
    const items = dict.publicAnswers.kinds.mozarthitos.items;
    render(<MozarthitosFaqAccordion items={items} />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/faq/metrics",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ kind: "visit", questionId: null }),
        }),
      );
    });

    const details = document.querySelector("details");
    expect(details).toBeInstanceOf(HTMLDetailsElement);
    (details as HTMLDetailsElement).open = true;
    details?.dispatchEvent(new Event("toggle", { bubbles: true }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/faq/metrics",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ kind: "open", questionId: items[0]?.id }),
        }),
      );
    });
  });
});

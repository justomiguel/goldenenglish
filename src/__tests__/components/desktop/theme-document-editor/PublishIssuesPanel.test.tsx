// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import en from "@/dictionaries/en.json";
import { PublishIssuesPanel } from "@/components/desktop/organisms/theme-document-editor/publish/PublishIssuesPanel";

const messages = en.admin.themeDocument.issue;

describe("PublishIssuesPanel", () => {
  it("shows the sentence and the code, and opens the field", () => {
    const onOpenField = vi.fn();
    render(
      <PublishIssuesPanel
        issues={[{ code: "token_missing", path: "tokens.color.primary" }]}
        messages={messages}
        onOpenField={onOpenField}
      />,
    );
    const button = screen.getByRole("button", { name: /token_missing/ });
    expect(button.textContent).toContain("Code: token_missing");
    expect(button.textContent).toContain("tokens.color.primary");
    fireEvent.click(button);
    expect(onOpenField).toHaveBeenCalledWith("tokens.color.primary");
  });

  it("shows the raw code when the sentence is missing", () => {
    render(
      <PublishIssuesPanel issues={[{ code: "mystery_code" }]} messages={messages} onOpenField={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /Code: mystery_code/ })).toBeTruthy();
  });
});

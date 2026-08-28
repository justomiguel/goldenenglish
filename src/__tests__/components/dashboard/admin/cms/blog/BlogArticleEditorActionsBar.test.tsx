import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BlogArticleEditorActionsBar } from "@/components/dashboard/admin/cms/blog/BlogArticleEditorActionsBar";
import { dictEn } from "@/test/dictEn";

const labels = dictEn.admin.cms.blog.editor;

function renderBar(
  overrides: Partial<ComponentProps<typeof BlogArticleEditorActionsBar>> = {},
) {
  return render(
    <BlogArticleEditorActionsBar
      labels={labels}
      translateTargets={[]}
      busy={false}
      hasGoogleKey={false}
      msg={null}
      onSave={vi.fn()}
      onPublish={vi.fn()}
      onTranslate={vi.fn()}
      {...overrides}
    />,
  );
}

describe("BlogArticleEditorActionsBar", () => {
  it("exposes save-draft and publish actions", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onPublish = vi.fn();
    renderBar({ onSave, onPublish });

    await user.click(screen.getByRole("button", { name: labels.save }));
    await user.click(screen.getByRole("button", { name: labels.publish }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onPublish).toHaveBeenCalledTimes(1);
  });
});

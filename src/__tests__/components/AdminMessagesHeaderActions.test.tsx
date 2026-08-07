// REGRESSION CHECK: Header must expose edit-default + write CTAs for admin messages.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/dictionaries/en.json";
import { AdminMessagesHeaderActions } from "@/components/dashboard/AdminMessagesHeaderActions";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
  usePathname: () => "/en/dashboard/admin/messages",
}));

vi.mock("@/app/[locale]/dashboard/admin/messages/defaultReplyActions", () => ({
  setMessagingDefaultReplyTemplateAction: vi.fn(),
}));

describe("AdminMessagesHeaderActions", () => {
  it("renders write message and edit default message controls", async () => {
    const user = userEvent.setup();
    render(
      <AdminMessagesHeaderActions
        locale="en"
        composeHref="/en/dashboard/admin/messages/compose"
        initialTemplates={{
          es: "Gracias {{instituteName}}",
          en: "Thanks {{instituteName}}",
          pt: "Obrigado {{instituteName}}",
        }}
        labels={en.admin.messages}
      />,
    );

    expect(screen.getByRole("link", { name: en.admin.messages.writeMessageCta })).toHaveAttribute(
      "href",
      "/en/dashboard/admin/messages/compose",
    );

    await user.click(screen.getByRole("button", { name: en.admin.messages.editDefaultMessageCta }));
    expect(screen.getByText(en.admin.messages.editDefaultMessageModalTitle)).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("Thanks {{instituteName}}");
    expect(screen.getByRole("tab", { name: en.admin.messages.editDefaultMessageTabEn })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

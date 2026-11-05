// REGRESSION CHECK: The export dialog sends the chosen scope and the remaining fields.
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/dictionaries/en.json";
import { AdminContactMessagesExportModal } from "@/components/dashboard/AdminContactMessagesExportModal";

const exportContactMessagesAction = vi.hoisted(() => vi.fn());

vi.mock("@/app/[locale]/dashboard/admin/messages/exportContactMessagesAction", () => ({
  exportContactMessagesAction,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard/admin/messages",
  useRouter: () => ({ refresh: vi.fn() }),
}));

describe("AdminContactMessagesExportModal", () => {
  it("downloads excel with the chosen scope and without an unchecked field", async () => {
    const user = userEvent.setup();
    exportContactMessagesAction.mockResolvedValue({
      ok: true,
      artifact: {
        filename: "contact-messages_2026-11-05.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        base64: btoa("xlsx"),
      },
    });
    vi.stubGlobal("URL", {
      createObjectURL: () => "blob:export",
      revokeObjectURL: vi.fn(),
    });
    HTMLAnchorElement.prototype.click = vi.fn();

    render(
      <AdminContactMessagesExportModal
        locale="en"
        open
        onOpenChange={vi.fn()}
        labels={en.admin.messages.contactExport}
      />,
    );

    await user.click(screen.getByRole("radio", { name: en.admin.messages.contactExport.scopeLatest }));
    await user.click(screen.getByRole("checkbox", { name: en.admin.messages.contactExport.fieldPhone }));
    await user.click(screen.getByRole("button", { name: en.admin.messages.contactExport.downloadXlsx }));

    expect(exportContactMessagesAction).toHaveBeenCalledWith({
      locale: "en",
      format: "xlsx",
      scope: "latest_2000",
      fields: ["sentAt", "name", "email", "subject", "body"],
    });
  });
});

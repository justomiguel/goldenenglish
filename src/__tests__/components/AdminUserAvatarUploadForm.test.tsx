/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import en from "@/dictionaries/en.json";
import { AdminUserAvatarUploadForm } from "@/components/molecules/AdminUserAvatarUploadForm";

const uploadAction = vi.fn();
const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/[locale]/dashboard/admin/users/adminUserDetailActions", () => ({
  uploadAdminStudentAvatarAction: (...a: unknown[]) => uploadAction(...a),
}));

describe("AdminUserAvatarUploadForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploadAction.mockResolvedValue({ ok: true, message: "Photo saved" });
  });

  // REGRESSION CHECK: Admin student profile photo upload must submit through
  // the audited admin action with targetUserId, not the current-user avatar flow.
  it("submits selected student avatar through the admin action", async () => {
    const user = userEvent.setup();
    render(
      <AdminUserAvatarUploadForm
        locale="en"
        targetUserId="student-1"
        labels={en.admin.users}
        onPreview={vi.fn()}
      />,
    );

    await user.upload(
      screen.getByLabelText(en.admin.users.detailAvatarChoose),
      new File(["avatar"], "avatar.png", { type: "image/png" }),
    );
    await user.click(screen.getByRole("button", { name: en.admin.users.detailAvatarUpload }));

    await waitFor(() => expect(uploadAction).toHaveBeenCalledTimes(1));
    const formData = uploadAction.mock.calls[0][0] as FormData;
    expect(formData.get("locale")).toBe("en");
    expect(formData.get("targetUserId")).toBe("student-1");
    expect(formData.get("avatar")).toBeInstanceOf(File);
    expect(refresh).toHaveBeenCalled();
    expect(screen.getByText("Photo saved")).toBeInTheDocument();
  });
});

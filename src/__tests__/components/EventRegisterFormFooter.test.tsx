import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventRegisterFormFooter } from "@/components/organisms/EventRegisterFormFooter";

const labels = {
  consentLabel: "I agree",
  captchaRequired: "Captcha",
  submitLabel: "Send registration",
  fileUploadProgressSending: "Sending",
};

describe("EventRegisterFormFooter", () => {
  it("disables submit on a form preview", () => {
    render(
      <EventRegisterFormFooter
        consent
        onConsentChange={() => undefined}
        consentLabel={labels.consentLabel}
        captchaRequired={labels.captchaRequired}
        receiptFieldError=""
        submitLabel={labels.submitLabel}
        isPending={false}
        fileUploadProgressSending={labels.fileUploadProgressSending}
        message=""
        preview
      />,
    );

    expect(screen.getByRole("button", { name: labels.submitLabel })).toBeDisabled();
  });
});

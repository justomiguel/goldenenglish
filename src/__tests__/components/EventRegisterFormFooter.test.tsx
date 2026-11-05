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
    expect(screen.queryByText(labels.fileUploadProgressSending)).toBeNull();
  });

  it("shows the sending bar only after the upload reports a percent", () => {
    const { rerender } = render(
      <EventRegisterFormFooter
        consent
        onConsentChange={() => undefined}
        consentLabel={labels.consentLabel}
        captchaRequired={labels.captchaRequired}
        receiptFieldError=""
        submitLabel={labels.submitLabel}
        isPending
        fileUploadProgressSending={labels.fileUploadProgressSending}
        message=""
      />,
    );

    expect(screen.queryByRole("progressbar")).toBeNull();

    rerender(
      <EventRegisterFormFooter
        consent
        onConsentChange={() => undefined}
        consentLabel={labels.consentLabel}
        captchaRequired={labels.captchaRequired}
        receiptFieldError=""
        submitLabel={labels.submitLabel}
        isPending
        uploadPercent={40}
        fileUploadProgressSending={labels.fileUploadProgressSending}
        message=""
      />,
    );

    expect(screen.getByText(labels.fileUploadProgressSending)).toBeTruthy();
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "40");
  });
});

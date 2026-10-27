"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { Button } from "@/components/atoms/Button";
import { recordPortalMessageFollowUp } from "@/app/[locale]/dashboard/admin/messages/followUpActions";
import { trackEvent } from "@/lib/analytics/trackClient";
import type { AdminMessageContactHrefs } from "@/lib/messaging/adminMessageContactLinks";
import type { AdminMessageFollowUpChannel } from "@/lib/messaging/adminMessageStatus";
import type { Dictionary } from "@/types/i18n";

interface AdminMessageContactActionsProps {
  locale: string;
  messageId: string;
  labels: Dictionary["admin"]["messages"];
  hrefs: AdminMessageContactHrefs;
}

const ACTIONS: Array<{
  channel: AdminMessageFollowUpChannel;
  hrefKey: keyof AdminMessageContactHrefs;
  labelKey: "openMail" | "openGmail" | "openOutlook" | "openWhatsapp";
  titleKey: "openMailTitle" | "openGmailTitle" | "openOutlookTitle" | "openWhatsappTitle";
  icon: "mail" | "whatsapp";
}> = [
  { channel: "mailto", hrefKey: "mailto", labelKey: "openMail", titleKey: "openMailTitle", icon: "mail" },
  { channel: "gmail", hrefKey: "gmail", labelKey: "openGmail", titleKey: "openGmailTitle", icon: "mail" },
  { channel: "outlook", hrefKey: "outlook", labelKey: "openOutlook", titleKey: "openOutlookTitle", icon: "mail" },
  { channel: "whatsapp", hrefKey: "whatsapp", labelKey: "openWhatsapp", titleKey: "openWhatsappTitle", icon: "whatsapp" },
];

export function AdminMessageContactActions({
  locale,
  messageId,
  labels,
  hrefs,
}: AdminMessageContactActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const visible = ACTIONS.filter((action) => hrefs[action.hrefKey]);
  if (visible.length === 0) return null;

  async function open(channel: AdminMessageFollowUpChannel, href: string) {
    setPending(true);
    setFailed(false);
    const result = await recordPortalMessageFollowUp({ locale, messageId, channel });
    setPending(false);
    if (!result.ok) {
      setFailed(true);
      return;
    }
    trackEvent("click", "message", { channel, messageId });
    if (channel === "mailto") {
      window.location.assign(href);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
    router.refresh();
  }

  return (
    <>
      {visible.map((action) => {
        const href = hrefs[action.hrefKey];
        if (!href) return null;
        const Icon = action.icon === "whatsapp" ? MessageCircle : Mail;
        return (
          <Button
            key={action.channel}
            type="button"
            variant="ghost"
            className="min-h-[44px] min-w-0 justify-center px-3 text-xs sm:text-sm"
            title={labels[action.titleKey]}
            disabled={pending}
            onClick={() => void open(action.channel, href)}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{labels[action.labelKey]}</span>
          </Button>
        );
      })}
      {failed ? (
        <p className="col-span-2 text-xs text-[var(--color-foreground)]" role="alert">
          {labels.contactActionError}
        </p>
      ) : null}
    </>
  );
}

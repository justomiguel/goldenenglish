"use client";

import type { ReactNode } from "react";
import { Inbox, Settings } from "lucide-react";
import { UnderlineTabBar } from "@/components/molecules/UnderlineTabBar";
import { usePersistentPageTab } from "@/hooks/usePersistentPageTab";
import { ADMIN_TOUR_ANCHORS } from "@/lib/admin-tutorials/selectors";
import {
  REGISTRATIONS_PAGE_TABS,
  type RegistrationsPageTab,
} from "@/lib/register/parseRegistrationsPageTab";

interface AdminRegistrationsTabsProps {
  labels: { list: string; config: string; aria: string };
  children: ReactNode;
}

export function AdminRegistrationsTabs({ labels, children }: AdminRegistrationsTabsProps) {
  const { value, setValue } = usePersistentPageTab<RegistrationsPageTab>({
    allowed: REGISTRATIONS_PAGE_TABS,
    fallback: "list",
  });

  return (
    <div className="mt-4">
      <div data-tour={ADMIN_TOUR_ANCHORS.registrationsTabs}>
        <UnderlineTabBar
          idPrefix="admin-registrations"
          ariaLabel={labels.aria}
          value={value}
          onChange={(id) => setValue(id as RegistrationsPageTab)}
          items={[
            { id: "list", label: labels.list, Icon: Inbox },
            { id: "config", label: labels.config, Icon: Settings },
          ]}
        />
      </div>
      <div
        role="tabpanel"
        id={`admin-registrations-panel-${value}`}
        aria-labelledby={`admin-registrations-tab-${value}`}
        className="mt-4"
      >
        {children}
      </div>
    </div>
  );
}

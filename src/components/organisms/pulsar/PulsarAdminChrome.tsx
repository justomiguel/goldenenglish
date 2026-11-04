import { PulsarPanelFrame } from "@/components/organisms/pulsar/PulsarPanelFrame";
import { loadPlatformUserProfile } from "@/lib/pulsar/platformUserProfileStore";
import { getPulsarStaffSession } from "@/lib/pulsar/pulsarStaffAuth";
import type { Dictionary } from "@/types/i18n";

export async function PulsarAdminChrome({
  locale,
  dict,
  email,
  extra = null,
  children,
}: {
  locale: string;
  dict: Dictionary;
  email: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  const session = await getPulsarStaffSession();
  const profile = session
    ? await loadPlatformUserProfile(session.userId)
    : { displayName: "", avatarUrl: null, phone: "" };
  return (
    <PulsarPanelFrame
      locale={locale}
      dict={dict}
      email={email}
      displayName={profile.displayName}
      phone={profile.phone}
      avatarUrl={profile.avatarUrl}
      role="staff"
      extra={extra}
    >
      {children}
    </PulsarPanelFrame>
  );
}

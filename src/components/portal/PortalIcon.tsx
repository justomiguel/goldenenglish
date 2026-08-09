import { CalendarCheck, Home, MessageCircle, TrendingUp, Wallet } from "lucide-react";
import type { PortalIconName } from "@/lib/portal/portalShellTypes";

const ICONS: Record<PortalIconName, typeof Home> = {
  home: Home,
  calendar: CalendarCheck,
  progress: TrendingUp,
  payments: Wallet,
  messages: MessageCircle,
};

export function PortalIcon({ name, className }: { name: PortalIconName; className?: string }) {
  const Glyph = ICONS[name];
  return <Glyph className={className} aria-hidden />;
}

import {
  Award,
  Calendar,
  MessageCircle,
  Settings,
  TrendingUp,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ParentTutorialIconId } from "@/lib/parent-tutorials/catalog";

export const PARENT_TUTORIAL_CATALOG_ICONS: Record<ParentTutorialIconId, LucideIcon> = {
  wallet: Wallet,
  trendingUp: TrendingUp,
  messageCircle: MessageCircle,
  user: User,
  calendar: Calendar,
  award: Award,
  settings: Settings,
};

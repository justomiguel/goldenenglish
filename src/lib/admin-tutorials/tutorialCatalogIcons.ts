import { GraduationCap, Layers, School, Shield, Users, type LucideIcon } from "lucide-react";
import type { AdminTutorialIconId } from "@/lib/admin-tutorials/catalog";

/** Lucide icons for admin help catalog rows (narrow imports per step). */
export const ADMIN_TUTORIAL_CATALOG_ICONS: Record<AdminTutorialIconId, LucideIcon> = {
  layers: Layers,
  users: Users,
  graduationCap: GraduationCap,
  school: School,
  shield: Shield,
};

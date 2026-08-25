"use client";

import { useEffect, useState } from "react";
import { adminUserDetailId } from "@/lib/dashboard/adminInstituteChildPaths";
import { loadAdminPersonRecordRoleAction } from "@/app/[locale]/dashboard/admin/users/loadAdminPersonRecordRoleAction";

export function useAdminPersonRecordRole(pathname: string, base: string): string | null {
  const userId = adminUserDetailId(pathname, base);
  const [fetched, setFetched] = useState<{ id: string; role: string | null } | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void loadAdminPersonRecordRoleAction(userId).then((next) => {
      if (!cancelled) setFetched({ id: userId, role: next });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!userId) return null;
  if (fetched?.id !== userId) return null;
  return fetched.role;
}

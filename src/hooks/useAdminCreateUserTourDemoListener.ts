"use client";

import { useEffect } from "react";
import {
  demoBirthIsoForTourPath,
  type CreateUserTourDemoDetail,
} from "@/lib/admin-tutorials/createUserTourDemo";
import { ADMIN_TUTORIAL_APPLY_CREATE_USER_DEMO_EVENT } from "@/lib/admin-tutorials/selectors";
import type { AdminCreateUserRoleOption } from "@/components/dashboard/AdminCreateUserPersonalBlock";

type Setters = {
  legalAgeMajority: number;
  setRole: (role: AdminCreateUserRoleOption) => void;
  setBirthDate: (iso: string) => void;
  resetGuardianUi: () => void;
};

/**
 * Applies guide-only role / sample birth date from create-user tours
 * (`ge:admin-tutorial:apply-create-user-demo`).
 */
export function useAdminCreateUserTourDemoListener(setters: Setters): void {
  const { legalAgeMajority, setRole, setBirthDate, resetGuardianUi } = setters;

  useEffect(() => {
    const onDemo = (event: Event) => {
      const detail = (event as CustomEvent<CreateUserTourDemoDetail>).detail;
      if (!detail?.role) return;
      setRole(detail.role);
      if (detail.role !== "student") {
        setBirthDate("");
        resetGuardianUi();
        return;
      }
      if (detail.birthPath === "minor" || detail.birthPath === "adult") {
        setBirthDate(demoBirthIsoForTourPath(detail.birthPath, legalAgeMajority));
        resetGuardianUi();
      }
    };
    window.addEventListener(ADMIN_TUTORIAL_APPLY_CREATE_USER_DEMO_EVENT, onDemo);
    return () => {
      window.removeEventListener(ADMIN_TUTORIAL_APPLY_CREATE_USER_DEMO_EVENT, onDemo);
    };
  }, [legalAgeMajority, setRole, setBirthDate, resetGuardianUi]);
}

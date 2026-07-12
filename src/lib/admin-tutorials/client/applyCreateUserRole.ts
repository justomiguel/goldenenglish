import { dispatchCreateUserTourDemo } from "@/lib/admin-tutorials/client/dispatchCreateUserTourDemo";
import { ADMIN_TOUR_ANCHORS, adminTourSelector } from "@/lib/admin-tutorials/selectors";

/** Set create-user role via React demo event + native select fallback. */
export function applyCreateUserRole(role: "student" | "teacher" | "admin"): void {
  dispatchCreateUserTourDemo({ role });
  const select = document.querySelector<HTMLSelectElement>(
    adminTourSelector(ADMIN_TOUR_ANCHORS.createUserRole),
  );
  if (!select || select.value === role) return;
  select.value = role;
  select.dispatchEvent(new Event("change", { bubbles: true }));
}

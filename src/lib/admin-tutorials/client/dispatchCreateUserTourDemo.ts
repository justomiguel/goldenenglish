import {
  ADMIN_TUTORIAL_APPLY_CREATE_USER_DEMO_EVENT,
} from "@/lib/admin-tutorials/selectors";
import type { CreateUserTourDemoDetail } from "@/lib/admin-tutorials/createUserTourDemo";

/** Ask the create-user form to apply role / sample birth date (React-controlled). */
export function dispatchCreateUserTourDemo(detail: CreateUserTourDemoDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CreateUserTourDemoDetail>(ADMIN_TUTORIAL_APPLY_CREATE_USER_DEMO_EVENT, {
      detail,
    }),
  );
}

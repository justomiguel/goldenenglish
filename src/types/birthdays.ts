/** Row from `portal_upcoming_birthdays_for_viewer` PostgREST/RPC. */
export type PortalBirthdayRpcRow = {
  student_id: string;
  first_name: string | null;
  last_name: string | null;
  birth_date: string;
  celebration_date: string;
  is_celebration_today: boolean;
};

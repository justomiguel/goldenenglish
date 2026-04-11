export interface AdminRegistrationRow {
  id: string;
  first_name: string;
  last_name: string;
  dni: string;
  email: string;
  phone: string | null;
  birth_date: string | null;
  level_interest: string | null;
  status: string;
  created_at: string | null;
}

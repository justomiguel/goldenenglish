/** Timeline row for `/dashboard/student/messages`. */
export type StudentPortalMessageLineDto = {
  id: string;
  from_me: boolean;
  body_html: string;
  created_at: string;
  can_delete: boolean;
  peer_name: string;
  incoming_label: string;
  /** Present when this row represents a broadcast copy (delete expands server-side). */
  broadcast_batch_id?: string | null;
};

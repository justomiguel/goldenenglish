/** One pending transfer request row for admin / teacher UIs. */
export type AdminTransferInboxRow = {
  id: string;
  studentLabel: string;
  fromLabel: string;
  toLabel: string;
  byLabel: string;
  note: string | null;
  createdAt: string;
};

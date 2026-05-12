export type MessagingRecipient = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
};

/** Row for admin portal messages inbox / sent / all tables. */
export type AdminPortalMessageRow = {
  id: string;
  fromName: string;
  toName: string;
  fromRole: string;
  toRole: string;
  createdAt: string;
  preview: string;
};

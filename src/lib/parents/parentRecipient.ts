export type ParentMailMode = "cc" | "bcc" | "individual";

export type ParentRecipient = {
  id: string;
  firstName: string;
  lastName: string;
  /** Deliverable mailbox, or null when synthetic / missing. */
  email: string | null;
};

export type ParentAccessFilter = "all" | "never" | "entered";

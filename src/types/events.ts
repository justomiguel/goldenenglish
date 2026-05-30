export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  eventDate: string;
  location: string | null;
  capacity: number;
  price: number | null;
  currency: string;
  status: "draft" | "published" | "closed" | "cancelled";
}

export interface EventPaymentRecord {
  id: string;
  eventAttendeeId: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected";
  receiptStoragePath: string | null;
  reviewNotes: string | null;
}

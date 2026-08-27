import { slugifyPublicPathSegment } from "@/lib/site/slugifyPublicPathSegment";

export function slugifyEventTitle(value: string): string {
  return slugifyPublicPathSegment(value);
}

export function eventPublicLandingFilters(input: {
  slug: string;
  eventId?: string;
  includeUnpublished?: boolean;
}): { column: "id" | "slug"; value: string; publishedOnly: boolean } {
  if (input.eventId) {
    return {
      column: "id",
      value: input.eventId,
      publishedOnly: !input.includeUnpublished,
    };
  }
  return { column: "slug", value: input.slug, publishedOnly: true };
}

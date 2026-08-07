import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { downloadEventUploadImageForExport } from "@/lib/events/export/downloadEventUploadImageForExport";
import type { EventAttendeesExportTable } from "@/lib/events/export/eventAttendeesExportTypes";

export async function enrichEventAttendeesExportTableImages(
  adminClient: SupabaseClient,
  table: EventAttendeesExportTable,
): Promise<EventAttendeesExportTable> {
  const cache = new Map<string, Awaited<ReturnType<typeof downloadEventUploadImageForExport>>>();

  const rows = await Promise.all(
    table.rows.map(async (row) =>
      Promise.all(
        row.map(async (cell) => {
          const path = cell.imagePath?.trim();
          if (!path) return cell;
          let image = cache.get(path);
          if (image === undefined) {
            image = await downloadEventUploadImageForExport(adminClient, path);
            cache.set(path, image);
          }
          if (!image) return { text: cell.text };
          return {
            text: cell.text,
            image: {
              dataUrl: image.dataUrl,
              bytes: image.bytes,
              extension: image.extension,
            },
          };
        }),
      ),
    ),
  );

  return { headers: table.headers, rows };
}

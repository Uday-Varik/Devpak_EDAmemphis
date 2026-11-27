import { supabase } from "@/integrations/supabase/client";

// Origin of this project's Supabase API, read from the client so it stays in sync with client.ts.
const SUPABASE_ORIGIN = new URL(supabase.storage.from("profile-assets").getPublicUrl("_").data.publicUrl).origin;
const PUBLIC_OBJECT_PATH = "/storage/v1/object/public/";

/**
 * True only for public object URLs on this project's Supabase storage (SEC-11).
 * Photo URLs are shown in the app and fetched by the PDF exporter, so any other host would leak the
 * viewer's IP and could act as a tracking beacon.
 */
export function isSupabaseStorageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.origin === SUPABASE_ORIGIN && u.pathname.startsWith(PUBLIC_OBJECT_PATH);
  } catch {
    return false;
  }
}

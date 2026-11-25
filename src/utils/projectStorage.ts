import { supabase } from "@/integrations/supabase/client";

export const PROJECT_PHOTOS_BUCKET = "project-photos";
export const PROJECT_DRAWINGS_BUCKET = "project-drawings";
export const SIGNED_URL_TTL_SECONDS = 3600;

/** A site photo or drawing as stored in project_details JSON. New rows store `path`; legacy rows store a public `url`. */
export interface StoredProjectFile {
  path?: string;
  url?: string;
  fileType?: string;
}

/** The value to store or look up: the object path for new rows, the legacy URL otherwise. */
export const getStoredFileRef = (item: StoredProjectFile): string => item.path || item.url || "";

/**
 * Normalize a stored reference to an object path inside `bucket`.
 * A bare path is returned as-is. A full Supabase storage URL (legacy public links)
 * yields the path after `/<bucket>/`, with query and hash stripped.
 */
export const extractStoragePath = (value: string | null | undefined, bucket: string): string | null => {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) return raw;
  const marker = `/${bucket}/`;
  const idx = raw.indexOf(marker);
  if (idx === -1) return null;
  const rest = raw.slice(idx + marker.length).split(/[?#]/)[0];
  try {
    return decodeURIComponent(rest) || null;
  } catch {
    return null;
  }
};

/** Signed URL for a stored reference, or null if it cannot be resolved or signed. */
export const createSignedFileUrl = async (
  bucket: string,
  value: string | null | undefined,
  expiresIn: number = SIGNED_URL_TTL_SECONDS,
): Promise<string | null> => {
  const path = extractStoragePath(value, bucket);
  if (!path) return null;
  try {
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
};

/** Remove the object behind a stored reference. */
export const deleteProjectFile = async (bucket: string, value: string | null | undefined): Promise<void> => {
  const path = extractStoragePath(value, bucket);
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

/**
 * Prepare stored files for PDF rendering. Each image is signed and downloaded into a data URL
 * so the renderer never fetches on its own. Items that cannot be signed or downloaded are dropped
 * (the export continues without them). PDF attachments are not embedded, so they pass through.
 */
const prepareExportImage = async (item: StoredProjectFile, bucket: string): Promise<StoredProjectFile | null> => {
  if (item.fileType === "pdf") return item;
  const signed = await createSignedFileUrl(bucket, getStoredFileRef(item));
  if (!signed) return null;
  try {
    const res = await fetch(signed);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return { ...item, url: await blobToDataUrl(await res.blob()) };
  } catch (error) {
    console.warn("Skipping project image that failed to load", error);
    return null;
  }
};

export const resolveExportImages = async <T extends StoredProjectFile>(items: T[], bucket: string): Promise<T[]> => {
  const prepared = await Promise.all(items.map((item) => prepareExportImage(item, bucket)));
  return prepared.filter((item): item is StoredProjectFile => item !== null) as T[];
};

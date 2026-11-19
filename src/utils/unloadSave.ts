// Final saves on tab close. A normal request can be cancelled when the page unloads, so
// the last save of a section goes out as a keepalive fetch, which the browser finishes
// after the page is gone. Only tab closes use this path; in-app navigation keeps the
// normal save, since the page is still alive there.

// Mirrors SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in src/integrations/supabase/client.ts
// (that file is generated and cannot import them). The key is public, so duplicating it is safe.
const SUPABASE_URL = "https://jxmcdmimeynacwkumste.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4bWNkbWltZXluYWN3a3Vtc3RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwODIzMTgsImV4cCI6MjA4NTY1ODMxOH0.nGbs-IfTYSXPa94ElIag9DLUpyAgslBWdPoUx544D7I";

// ponytail: keepalive bodies are capped near 64 KB. Larger sections fall back to the normal save, which may not finish on close. Upgrade: split or compress.
const KEEPALIVE_BODY_LIMIT = 60_000;

let unloading = false;

/** Called from the beforeunload handler. The flag is cleared on the next tick, so a cancelled unload does not leave it set. */
export const markPageUnloading = () => {
  unloading = true;
  setTimeout(() => {
    unloading = false;
  }, 0);
};

export const isPageUnloading = () => unloading;

/**
 * Upserts one section and updates project progress with keepalive requests.
 * Returns false (and sends nothing) when the body is too large or there is no token,
 * so the caller can fall back to the normal save.
 */
export const keepaliveSectionSave = (
  accessToken: string,
  projectId: string,
  section: string,
  data: Record<string, unknown>,
  markComplete: boolean,
  progress: number
): boolean => {
  const detail = JSON.stringify({ project_id: projectId, section, data, completed: markComplete });
  if (!accessToken || detail.length > KEEPALIVE_BODY_LIMIT) return false;

  const send = (path: string, method: "POST" | "PATCH", body: string, prefer: string) =>
    fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      keepalive: true,
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Prefer: prefer,
      },
      body,
    }).catch((e) => console.error("Final save on leave failed:", e));

  send("project_details?on_conflict=project_id,section", "POST", detail, "resolution=merge-duplicates");
  send(`projects?id=eq.${encodeURIComponent(projectId)}`, "PATCH", JSON.stringify({ progress }), "return=minimal");
  return true;
};

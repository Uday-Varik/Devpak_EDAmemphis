import { useEffect, useState } from "react";
import { createSignedFileUrl } from "@/utils/projectStorage";

/** Signed display URLs keyed by stored reference. Re-signs when the set of references changes. */
export const useSignedProjectFileUrls = (bucket: string, refs: string[]): Record<string, string> => {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = refs.join("\n");

  useEffect(() => {
    let cancelled = false;
    const unique = Array.from(new Set(key.split("\n").filter(Boolean)));
    Promise.all(unique.map(async (ref) => [ref, await createSignedFileUrl(bucket, ref)] as const)).then((entries) => {
      if (cancelled) return;
      const next: Record<string, string> = {};
      for (const [ref, url] of entries) if (url) next[ref] = url;
      setUrls(next);
    });
    return () => {
      cancelled = true;
    };
  }, [bucket, key]);

  return urls;
};

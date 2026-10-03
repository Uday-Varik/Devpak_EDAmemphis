import { useEffect, useRef, useState } from "react";

export const useAutoSave = (
  data: any,
  onSave: (data: any) => Promise<void>,
  delay: number = 1500
) => {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousDataRef = useRef<string>("");
  const initializedRef = useRef(false);
  const latestDataRef = useRef<any>(data);
  const onSaveRef = useRef(onSave);
  const dirtyRef = useRef(false);

  // Keep latest references up to date
  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);
  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const flush = async () => {
    if (!dirtyRef.current) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    try {
      await onSaveRef.current(latestDataRef.current);
      previousDataRef.current = JSON.stringify(latestDataRef.current);
      dirtyRef.current = false;
    } catch (e) {
      console.error("Auto-save flush failed:", e);
    }
  };

  useEffect(() => {
    const currentData = JSON.stringify(data);

    if (!initializedRef.current) {
      previousDataRef.current = currentData;
      initializedRef.current = true;
      return;
    }

    if (currentData === previousDataRef.current) return;
    dirtyRef.current = true;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        setSaveStatus("saving");
        await onSaveRef.current(latestDataRef.current);
        setSaveStatus("saved");
        setLastSaved(new Date());
        previousDataRef.current = JSON.stringify(latestDataRef.current);
        dirtyRef.current = false;
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus("idle");
      }
    }, delay);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [data, delay]);

  // beforeunload warning + best-effort save on tab close/refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        // Fire-and-forget save (browser may cut it short, but we try)
        try { onSaveRef.current(latestDataRef.current); } catch {}
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  // Save on unmount (e.g., user navigates to another section)
  useEffect(() => {
    return () => {
      if (dirtyRef.current) {
        try { onSaveRef.current(latestDataRef.current); } catch (e) { console.error(e); }
      }
    };
  }, []);

  return { saveStatus, lastSaved, flush };
};

import { useEffect, useRef, useState } from "react";
import { markPageUnloading } from "@/utils/unloadSave";

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

  // Fire-and-forget save for unload/unmount. The page cannot await it, so the
  // rejection must be handled here, or it surfaces as an unhandled promise rejection.
  const saveInBackground = () => {
    try {
      Promise.resolve(onSaveRef.current(latestDataRef.current)).catch((e) =>
        console.error("Auto-save on leave failed:", e)
      );
    } catch (e) {
      console.error("Auto-save on leave failed:", e);
    }
  };

  // beforeunload warning + final save on tab close/refresh. The prompt shows while dirtyRef is
  // set, which stays true until a save succeeds, so pending and failed saves both prompt.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        markPageUnloading();
        saveInBackground();
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
      if (dirtyRef.current) saveInBackground();
    };
  }, []);

  return { saveStatus, lastSaved, flush };
};

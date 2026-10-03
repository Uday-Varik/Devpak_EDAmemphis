import { useEffect, useState, useCallback } from "react";

const KEY = "devpack:teachingMode";
const EVENT = "devpack:teachingModeChanged";

const read = (): boolean => {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? true : v === "true";
  } catch {
    return true;
  }
};

export const useTeachingMode = () => {
  const [enabled, setEnabled] = useState<boolean>(read);

  useEffect(() => {
    const handler = () => setEnabled(read());
    window.addEventListener(EVENT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const toggle = useCallback(() => {
    const next = !read();
    try {
      localStorage.setItem(KEY, String(next));
    } catch {
      /* ignore */
    }
    setEnabled(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { enabled, toggle };
};

export const isTeachingModeEnabled = read;

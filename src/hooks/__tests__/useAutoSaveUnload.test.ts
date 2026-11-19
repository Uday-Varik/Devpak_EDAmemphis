import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "../useAutoSave";
import { isPageUnloading } from "@/utils/unloadSave";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAutoSave unload flag", () => {
  it("marks the page as unloading only during a tab-close save", async () => {
    const seen: boolean[] = [];
    const onSave = vi.fn(async () => {
      seen.push(isPageUnloading());
    });

    const { rerender, unmount } = renderHook(({ data }) => useAutoSave(data, onSave, 1500), {
      initialProps: { data: { a: 1 } },
    });
    rerender({ data: { a: 2 } });
    await act(async () => {
      window.dispatchEvent(new Event("beforeunload"));
    });
    expect(seen).toEqual([true]);

    // The flag clears on the next tick; let it clear before in-app navigation (unmount).
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
    rerender({ data: { a: 3 } });
    unmount(); // in-app navigation: normal save, no keepalive
    expect(seen).toEqual([true, false]);
  });
});

describe("useAutoSave save on leave", () => {
  it("saves the latest data on beforeunload and logs (not throws) a rejection", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const onSave = vi.fn().mockRejectedValue(new Error("offline"));

    const { rerender } = renderHook(({ data }) => useAutoSave(data, onSave, 1500), {
      initialProps: { data: { a: 1 } },
    });
    rerender({ data: { a: 2 } }); // dirty, not yet debounced

    await act(async () => {
      window.dispatchEvent(new Event("beforeunload"));
      await Promise.resolve();
    });

    expect(onSave).toHaveBeenCalledWith({ a: 2 });
    expect(err).toHaveBeenCalledWith("Auto-save on leave failed:", expect.any(Error));
  });

  it("saves on unmount and handles a rejection without an unhandled rejection", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const onSave = vi.fn().mockRejectedValue(new Error("offline"));

    const { rerender, unmount } = renderHook(({ data }) => useAutoSave(data, onSave, 1500), {
      initialProps: { data: { a: 1 } },
    });
    rerender({ data: { a: 3 } });

    unmount();
    await act(async () => {
      await Promise.resolve();
    });

    expect(onSave).toHaveBeenCalledWith({ a: 3 });
    expect(err).toHaveBeenCalledWith("Auto-save on leave failed:", expect.any(Error));
  });
});

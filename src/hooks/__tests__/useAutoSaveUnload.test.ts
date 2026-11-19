import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "../useAutoSave";

afterEach(() => {
  vi.restoreAllMocks();
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

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAutoSave } from "../useAutoSave";

describe("useAutoSave status", () => {
  it("reports error when the save rejects", async () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockRejectedValue(new Error("network down"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, onSave, 1500),
      { initialProps: { data: { a: 1 } } }
    );
    rerender({ data: { a: 2 } });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(result.current.saveStatus).toBe("error");
    vi.useRealTimers();
  });

  it("reports saved when the save resolves", async () => {
    vi.useFakeTimers();
    const onSave = vi.fn().mockResolvedValue(undefined);

    const { result, rerender } = renderHook(
      ({ data }) => useAutoSave(data, onSave, 1500),
      { initialProps: { data: { a: 1 } } }
    );
    rerender({ data: { a: 2 } });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.saveStatus).toBe("saved");
    vi.useRealTimers();
  });
});

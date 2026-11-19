import { describe, it, expect, vi, afterEach } from "vitest";
import { keepaliveSectionSave, isPageUnloading, markPageUnloading } from "../unloadSave";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("keepaliveSectionSave", () => {
  it("sends the section and progress with keepalive and the user's token", () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const ok = keepaliveSectionSave("tok-123", "proj-1", "budget-capital", { a: 1 }, false, 40);

    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [detailUrl, detailInit] = fetchMock.mock.calls[0];
    expect(detailUrl).toContain("/rest/v1/project_details?on_conflict=project_id,section");
    expect(detailInit.keepalive).toBe(true);
    expect(detailInit.headers.Authorization).toBe("Bearer tok-123");
    expect(JSON.parse(detailInit.body)).toEqual({
      project_id: "proj-1",
      section: "budget-capital",
      data: { a: 1 },
      completed: false,
    });
    const [progressUrl, progressInit] = fetchMock.mock.calls[1];
    expect(progressUrl).toContain("/rest/v1/projects?id=eq.proj-1");
    expect(progressInit.keepalive).toBe(true);
    expect(JSON.parse(progressInit.body)).toEqual({ progress: 40 });

    vi.unstubAllGlobals();
  });

  it("sends nothing and returns false when the body is over the keepalive limit", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const big = { text: "x".repeat(70_000) };
    expect(keepaliveSectionSave("tok", "p", "s", big, false, 0)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("returns false without a token", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(keepaliveSectionSave("", "p", "s", {}, false, 0)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});

describe("markPageUnloading", () => {
  it("clears the flag on the next tick so a cancelled unload does not stick", async () => {
    vi.useFakeTimers();
    markPageUnloading();
    expect(isPageUnloading()).toBe(true);
    vi.runAllTimers();
    expect(isPageUnloading()).toBe(false);
    vi.useRealTimers();
  });
});

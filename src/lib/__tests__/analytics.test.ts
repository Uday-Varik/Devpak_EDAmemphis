import { describe, it, expect, vi, afterEach } from "vitest";
import { trackPageView, trackEvent, analyticsEnabled, normalizePath } from "../analytics";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("analytics (unconfigured)", () => {
  it("is disabled when VITE_ANALYTICS_ENDPOINT is unset and sends nothing", () => {
    vi.stubEnv("VITE_ANALYTICS_ENDPOINT", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(analyticsEnabled()).toBe(false);
    expect(() => trackPageView("/dashboard")).not.toThrow();
    expect(() => trackEvent("project_created", { section: "x" })).not.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not throw when a configured fetch fails", async () => {
    vi.stubEnv("VITE_ANALYTICS_ENDPOINT", "https://analytics.example.test/api/event");
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));

    expect(() => trackEvent("section_saved")).not.toThrow();
    await new Promise((r) => setTimeout(r, 0));
  });
});

describe("normalizePath", () => {
  it("strips query strings, hashes and project ids", () => {
    expect(normalizePath("/project/8f14e45f-ceea-467a-9575-6e4bdc5c7dd1?tab=1#x")).toBe("/project/:id");
    expect(normalizePath("/dashboard?q=secret")).toBe("/dashboard");
  });
});

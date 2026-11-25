import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const sentry = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@sentry/react", () => sentry);

import { initMonitoring, captureException } from "@/lib/monitoring";

describe("monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("does not init Sentry when no DSN is set", () => {
    vi.stubEnv("VITE_SENTRY_DSN", "");
    initMonitoring();
    expect(sentry.init).not.toHaveBeenCalled();
  });

  it("captureException is a no-op when Sentry was not initialized", () => {
    captureException(new Error("boom"), { section: "budget" });
    expect(sentry.captureException).not.toHaveBeenCalled();
  });
});

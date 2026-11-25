import { describe, it, expect } from "vitest";
import {
  ATTOM_RATE_LIMIT_PER_HOUR,
  RATE_WINDOW_MS,
  allowed,
  rateWindowStartIso,
} from "../../../supabase/functions/attom-comps/rateLimit";

describe("attom-comps rate limit", () => {
  it("uses a 30 per hour limit over a one hour window", () => {
    expect(ATTOM_RATE_LIMIT_PER_HOUR).toBe(30);
    expect(RATE_WINDOW_MS).toBe(60 * 60 * 1000);
  });

  it("allows requests while the count is below the limit", () => {
    expect(allowed(0)).toBe(true);
    expect(allowed(29)).toBe(true);
  });

  it("rejects the request that would be the 31st, and anything above", () => {
    expect(allowed(30)).toBe(false);
    expect(allowed(31)).toBe(false);
  });

  it("respects an explicit limit argument", () => {
    expect(allowed(2, 3)).toBe(true);
    expect(allowed(3, 3)).toBe(false);
  });

  it("computes the window start as exactly one hour before now", () => {
    const now = Date.UTC(2026, 10, 25, 12, 0, 0);
    expect(rateWindowStartIso(now)).toBe("2026-11-25T11:00:00.000Z");
  });
});

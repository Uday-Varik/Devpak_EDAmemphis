import { describe, it, expect, vi, afterEach } from "vitest";
import {
  goToDeveloperEquity,
  consumeDeveloperEquityFocus,
  FOCUS_DEVELOPER_EQUITY_EVENT,
} from "../cashNotInvestedFocus";

afterEach(() => {
  consumeDeveloperEquityFocus(); // clear any pending request between tests
  vi.restoreAllMocks();
});

describe("Developer Equity link", () => {
  it("asks Budget to open and focus Developer Equity, and sends the navigation event", () => {
    const navigate = vi.fn();
    const focus = vi.fn();
    window.addEventListener("navigate-section", navigate);
    window.addEventListener(FOCUS_DEVELOPER_EQUITY_EVENT, focus);

    goToDeveloperEquity();

    expect(navigate).toHaveBeenCalledTimes(1);
    expect((navigate.mock.calls[0][0] as CustomEvent).detail).toBe("budget-capital");
    expect(focus).toHaveBeenCalledTimes(1);
    window.removeEventListener("navigate-section", navigate);
    window.removeEventListener(FOCUS_DEVELOPER_EQUITY_EVENT, focus);
  });

  it("keeps the request until Budget mounts, then gives it out once", () => {
    goToDeveloperEquity();
    expect(consumeDeveloperEquityFocus()).toBe(true);
    expect(consumeDeveloperEquityFocus()).toBe(false);
  });

  it("is not pending when nobody clicked the link", () => {
    expect(consumeDeveloperEquityFocus()).toBe(false);
  });
});

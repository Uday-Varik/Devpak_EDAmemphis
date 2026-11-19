import { describe, it, expect } from "vitest";
import { sourcesExceedUsesMessage } from "../validatePackage";

describe("sourcesExceedUsesMessage", () => {
  it("flags sources that exceed uses", () => {
    expect(sourcesExceedUsesMessage(-5000)).toBe(
      "Sources exceed uses by $5,000. Adjust sources or uses so the budget balances."
    );
  });

  it("does not flag a balanced budget or a funding gap", () => {
    expect(sourcesExceedUsesMessage(0)).toBeNull();
    expect(sourcesExceedUsesMessage(0.4)).toBeNull();
    expect(sourcesExceedUsesMessage(-0.4)).toBeNull();
    expect(sourcesExceedUsesMessage(12000)).toBeNull();
  });
});

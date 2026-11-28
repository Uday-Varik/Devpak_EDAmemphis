import { describe, it, expect } from "vitest";
import { exportFileBase, truncateLabel } from "../fileName";

describe("exportFileBase", () => {
  it("replaces unsafe characters and trims underscores", () => {
    expect(exportFileBase("  2187 Kimball Ave / Unit #2  ")).toBe("2187_Kimball_Ave_Unit_2");
  });

  it("falls back to DevPack for empty or symbol-only names", () => {
    expect(exportFileBase("")).toBe("DevPack");
    expect(exportFileBase(null)).toBe("DevPack");
    expect(exportFileBase("<>!!")).toBe("DevPack");
  });

  it("limits length to 80 characters", () => {
    expect(exportFileBase("a".repeat(200)).length).toBeLessThanOrEqual(80);
  });

  it("cuts at a word boundary, not mid-word", () => {
    const out = exportFileBase("alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi");
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.endsWith("_")).toBe(false);
    const words = out.split("_");
    expect(words.every((w) => ["alpha","beta","gamma","delta","epsilon","zeta","eta","theta","iota","kappa","lambda","mu","nu","xi","omicron","pi"].includes(w))).toBe(true);
  });

  it("does not keep HTML from a malicious name", () => {
    expect(exportFileBase('<img src=x onerror="alert(1)">')).not.toMatch(/[<>"=]/);
  });
});

describe("truncateLabel", () => {
  it("leaves short labels alone", () => {
    expect(truncateLabel("Short name")).toBe("Short name");
  });

  it("cuts long labels with an ellipsis", () => {
    const out = truncateLabel("x".repeat(100), 60);
    expect(out.length).toBe(60);
    expect(out.endsWith("...")).toBe(true);
  });
});
